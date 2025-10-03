package core

import (
	"log"
	"sync"
	"websocket-server/storage"

	jsonpatch "github.com/evanphx/json-patch"
	"github.com/gorilla/websocket"
)


type Hub struct {
	ProjectID string
	Clients map[*Client]bool
	Broadcast chan []byte
	Register chan *Client
	Unregister chan *Client
	Mutex sync.RWMutex
	ProjectJson []byte
}

type Client struct {
	Hub *Hub
	Conn *websocket.Conn
	Send chan []byte
	Id string
	ProjectID string
}

func (h *Hub) Run(storageProvider storage.StorageProvider) {
	for {
		select {
		case client := <-h.Register:
			h.Mutex.Lock()
			h.Clients[client] = true
			h.Mutex.Unlock()
			log.Printf("Client %s connected to project %s. Total clients in project: %d", 
				client.Id, h.ProjectID, len(h.Clients))

		case client := <-h.Unregister:
			h.Mutex.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
			}
			storageProvider.Save(h.ProjectID, h.ProjectJson)	
			h.Mutex.Unlock()
			log.Printf("Client %s disconnected from project %s. Total clients in project: %d", 
				client.Id, h.ProjectID, len(h.Clients))		

		case message := <-h.Broadcast:
			h.Mutex.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.Mutex.RUnlock()
		}
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for message := range c.Send {
		c.Conn.WriteMessage(websocket.TextMessage, message)
	}
	c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		

		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		patch, err:= jsonpatch.DecodePatch(message)

		println(string(c.Hub.ProjectJson))

		if err != nil {
			log.Printf("Invalid JSON patch from client %s in project %s: %v", c.Id, c.ProjectID, err)
			continue
		}

		c.Hub.ProjectJson, _ = patch.Apply(c.Hub.ProjectJson)

		println(string(c.Hub.ProjectJson))

		log.Printf("Received message from client %s in project %s: %s", 
			c.Id, c.ProjectID, string(message))
		c.Hub.Broadcast <- message
	}
}