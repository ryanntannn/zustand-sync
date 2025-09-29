package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"websocket-server/storage"

	jsonpatch "github.com/evanphx/json-patch"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type ProjectManager struct {
	projects map[string]*Hub
	mutex    sync.RWMutex
	storageProvider storage.StorageProvider
}

type Hub struct {
	projectID string
	clients map[*Client]bool
	broadcast chan []byte
	register chan *Client
	unregister chan *Client
	mutex sync.RWMutex
	projectJson []byte
}

type Client struct {
	hub *Hub
	conn *websocket.Conn
	send chan []byte
	id string
	projectID string
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Allow user to configure
		return true
	},
}

func newProjectManager() *ProjectManager {

	storagePath := os.Getenv("STORAGE_PATH")
	if storagePath == "" {
		storagePath = "./data"
	}

	return &ProjectManager{
		projects: make(map[string]*Hub),
		storageProvider: storage.NewFileSystemStorage(storagePath),
	}
}

func (pm *ProjectManager) getOrCreateHub(projectID string) *Hub {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	if hub, exists := pm.projects[projectID]; exists {
		return hub
	}	

	projectJson, err := pm.storageProvider.Load(projectID)

	if err != nil {
		log.Printf("No existing data for project %s, starting fresh.", projectID)
		projectJson = []byte(`{}`)
	} else {
		log.Printf("Loaded existing data for project %s", projectID)
	}

	hub := &Hub{
		projectID:  projectID,
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		projectJson: projectJson,
	}

	pm.projects[projectID] = hub
	go hub.run(pm.storageProvider)
	log.Printf("Created new hub for project: %s", projectID)
	
	return hub
}

func (h *Hub) run(storageProvider storage.StorageProvider) {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client] = true
			h.mutex.Unlock()
			log.Printf("Client %s connected to project %s. Total clients in project: %d", 
				client.id, h.projectID, len(h.clients))

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
			}
			storageProvider.Save(h.projectID, h.projectJson)
			h.mutex.Unlock()
			log.Printf("Client %s disconnected from project %s. Total clients in project: %d", 
				client.id, h.projectID, len(h.clients))		

		case message := <-h.broadcast:
			h.mutex.RLock()
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (c *Client) writePump() {
	defer c.conn.Close()
	for message := range c.send {
		c.conn.WriteMessage(websocket.TextMessage, message)
	}
	c.conn.WriteMessage(websocket.CloseMessage, []byte{})
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		patch, err:= jsonpatch.DecodePatch(message)

		println(string(c.hub.projectJson))

		if err != nil {
			log.Printf("Invalid JSON patch from client %s in project %s: %v", c.id, c.projectID, err)
			continue
		}

		c.hub.projectJson, _ = patch.Apply(c.hub.projectJson)

		println(string(c.hub.projectJson))

		log.Printf("Received message from client %s in project %s: %s", 
			c.id, c.projectID, string(message))
		c.hub.broadcast <- message
	}
}

func serveWS(projectManager *ProjectManager, w http.ResponseWriter, r *http.Request) {
	// Extract project ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/ws/")
	if path == "" || path == r.URL.Path {
		http.Error(w, "Project ID is required in URL path: /ws/{projectId}", http.StatusBadRequest)
		return
	}
	
	projectID := strings.Split(path, "/")[0]
	if projectID == "" {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	hub := projectManager.getOrCreateHub(projectID)

	clientID := fmt.Sprintf("client_%s_%d", projectID, len(hub.clients)+1)
	
	client := &Client{
		hub:       hub,
		conn:      conn,
		send:      make(chan []byte, 256),
		id:        clientID,
		projectID: projectID,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()

	// send initial state to the new client	
	client.send <- hub.projectJson
}

func main() {

	godotenv.Load()
	
	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8080"
	}

	projectManager := newProjectManager()

	// Handle WebSocket connections with project routing
	http.HandleFunc("/ws/", func(w http.ResponseWriter, r *http.Request) {
		serveWS(projectManager, w, r)
	})

	log.Println("WebSocket endpoint: ws://localhost:" + PORT + "/ws/{projectId}")
	err := http.ListenAndServe(":"+PORT, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}