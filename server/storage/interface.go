package storage

type StorageProvider interface {
	Save(projectID string, data []byte) error
	Load(projectID string) ([]byte, error)
	Delete(projectID string) error
}