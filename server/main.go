package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

type ProjectManager struct {
	projects map[string]*Hub
	mutex    sync.RWMutex
}

type Hub struct {
	projectID string
	clients map[*Client]bool
	broadcast chan []byte
	register chan *Client
	unregister chan *Client
	mutex sync.RWMutex
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
	return &ProjectManager{
		projects: make(map[string]*Hub),
	}
}

func (pm *ProjectManager) getOrCreateHub(projectID string) *Hub {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()

	if hub, exists := pm.projects[projectID]; exists {
		return hub
	}

	hub := &Hub{
		projectID:  projectID,
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}

	pm.projects[projectID] = hub
	go hub.run()
	log.Printf("Created new hub for project: %s", projectID)
	
	return hub
}

func (h *Hub) run() {
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
}

func main() {
	projectManager := newProjectManager()

	// Handle WebSocket connections with project routing
	http.HandleFunc("/ws/", func(w http.ResponseWriter, r *http.Request) {
		serveWS(projectManager, w, r)
	})

	log.Println("WebSocket endpoint: ws://localhost:8080/ws/{projectId}")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}