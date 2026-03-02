// Enhanced API endpoints (add these to your backend)
/*
PERSON MANAGEMENT (to be implemented in backend):

POST   /api/trees/:treeId/persons - Create person
PUT    /api/trees/:treeId/persons/:personId - Update person
DELETE /api/trees/:treeId/persons/:personId - Delete person

POST   /api/trees/:treeId/relations - Create relation
DELETE /api/trees/:treeId/relations/:relationId - Delete relation

Person payload example:
{
  "name": "Иван Иванов",
  "gender": "MALE",
  "birthDate": "1980-01-15",
  "deathDate": null,
  "birthPlace": "Москва",
  "bio": "Краткая биография",
  "photoUrl": "https://..."
}

Relation payload example:
{
  "type": "PARENT_CHILD", // or "SPOUSE"
  "person1Id": "uuid-1",
  "person2Id": "uuid-2"
}
*/

// API Helper Extended (add these methods to the api object in main file)
const apiExtended = {
    persons: {
      create: (treeId, data) => api.request(`/api/trees/${treeId}/persons`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      update: (treeId, personId, data) => api.request(`/api/trees/${treeId}/persons/${personId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
      delete: (treeId, personId) => api.request(`/api/trees/${treeId}/persons/${personId}`, {
        method: 'DELETE',
      }),
    },
    
    relations: {
      create: (treeId, data) => api.request(`/api/trees/${treeId}/relations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
      delete: (treeId, relationId) => api.request(`/api/trees/${treeId}/relations/${relationId}`, {
        method: 'DELETE',
      }),
    },
  };
  
  // Instructions for integration:
  // 1. Add the above methods to your main api object
  // 2. These components can be added to enhance the TreeViewer
  // 3. Import icons: Camera, Edit2, Trash2, Plus, Users, Heart
  
  export default apiExtended;