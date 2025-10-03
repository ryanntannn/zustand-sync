package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"websocket-server/core"
	"websocket-server/storage"

	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

type ProjectManager struct {
	projects map[string]*core.Hub
	mutex    sync.RWMutex
	storageProvider storage.StorageProvider
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
		projects: make(map[string]*core.Hub),
		storageProvider: storage.NewFileSystemStorage(storagePath),
	}
}

func (pm *ProjectManager) getOrCreateHub(projectID string) *core.Hub {
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

	hub := &core.Hub{
		ProjectID:  projectID,
		Broadcast:  make(chan []byte),
		Register:   make(chan *core.Client),
		Unregister: make(chan *core.Client),
		Clients:    make(map[*core.Client]bool),
		ProjectJson: projectJson,
	}

	pm.projects[projectID] = hub
	go hub.Run(pm.storageProvider)
	log.Printf("Created new hub for project: %s", projectID)
	
	return hub
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

	clientID := fmt.Sprintf("client_%s_%d", projectID, len(hub.Clients)+1)

	client := &core.Client{
		Hub:       hub,
		Conn:      conn,
		Send:      make(chan []byte, 256),
		Id:        clientID,
		ProjectID: projectID,
	}

	client.Hub.Register <- client

	go client.WritePump()
	go client.ReadPump()

	// send initial state to the new client
	client.Send <- hub.ProjectJson
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