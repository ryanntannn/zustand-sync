package storage

import (
	"fmt"
	"os"
)

type FileSystemStorage struct {
	basePath string
}

func (fsStorage *FileSystemStorage) Save(projectID string, data []byte) error {
	filePath := fmt.Sprintf("%s/%s.json", fsStorage.basePath, projectID)	
	return os.WriteFile(filePath, data, 0644)
}

func (fsStorage *FileSystemStorage) Load(projectID string) ([]byte, error) {
	filePath := fmt.Sprintf("%s/%s.json", fsStorage.basePath, projectID)
	return os.ReadFile(filePath)
}

func (fsStorage *FileSystemStorage) Delete(projectID string) error {
	filePath := fmt.Sprintf("%s/%s.json", fsStorage.basePath, projectID)
	return os.Remove(filePath)
}

func NewFileSystemStorage(basePath string) *FileSystemStorage {
	// Ensure the base path exists
	if _, err := os.Stat(basePath); os.IsNotExist(err) {
		os.MkdirAll(basePath, os.ModePerm)
	}
	return &FileSystemStorage{basePath: basePath}
}