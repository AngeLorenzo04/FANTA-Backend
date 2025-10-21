# API Design - Predictions Game

## Architettura Microservizi

```
┌─────────────┐
│   Client    │
│ (React/Vue) │
└──────┬──────┘
       │
┌──────▼──────┐
│ API Gateway │ 
│  (Express)  │
└──────┬──────┘
       │
   ┌───┴────────────────────┐
   │                        │
┌──▼────────┐      ┌────────▼────┐
│   Auth    │      │   Session   │
│  Service  │      │   Service   │
└───────────┘      └─────────────┘
       │                  │
       └────────┬─────────┘
                │
         ┌──────▼──────┐
         │  Supabase   │
         │ PostgreSQL  │
         └─────────────┘
```

---

## 1. Auth Service

### Base URL: `/api/auth`

#### POST `/register`
Registrazione nuovo utente

**Request:**
```json
{
  "email": "user@example.com",
  "username": "Mario",
  "password": "securePassword123",
  "role": "USER"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "Mario",
      "role": "USER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Errors:**
- `400` - Email già esistente
- `422` - Validazione fallita

---

#### POST `/login`
Login utente esistente

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "Mario",
      "role": "USER"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

**Errors:**
- `401` - Credenziali non valide

---

#### POST `/refresh`
Rinnova access token

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

#### GET `/me`
Ottieni info utente corrente

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "Mario",
    "role": "USER",
    "createdAt": "2025-10-18T10:30:00Z"
  }
}
```

---

#### POST `/logout`
Logout (invalida refresh token)

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---
## 2. Session Service

### Base URL: `/api/session`

---

### 📋 Gestione Sessione

#### GET `/current`
Ottieni info sulla sessione corrente

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Weekly Team Meeting",
    "description": "Gioco delle predizioni",
    "state": "OPEN",
    "maxPredictionsPerUser": 5,
    "admin": {
      "id": "uuid",
      "username": "Admin"
    },
    "stats": {
      "totalEvents": 8,
      "totalParticipants": 12
    },
    "createdAt": "2025-10-18T10:00:00Z",
    "openedAt": "2025-10-18T10:30:00Z"
  }
}
```

**Response 404:**
```json
{
  "success": false,
  "error": "No active session"
}
```

---

#### POST `/create`
**[ADMIN ONLY]** Crea nuova sessione

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "title": "Weekly Team Meeting",
  "description": "Gioco delle predizioni del venerdì",
  "maxPredictionsPerUser": 5
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Weekly Team Meeting",
    "state": "SETUP",
    "maxPredictionsPerUser": 5
  }
}
```

**Errors:**
- `403` - Solo admin può creare sessioni
- `409` - Esiste già una sessione attiva

---

#### PATCH `/state`
**[ADMIN ONLY]** Cambia stato della sessione

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "state": "OPEN"
}
```

**Valid transitions:**
- `SETUP` → `OPEN` (apri predizioni)
- `OPEN` → `ACTIVE` (chiudi predizioni, avvia)
- `ACTIVE` → `CLOSED` (concludi sessione)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "state": "OPEN",
    "updatedAt": "2025-10-18T10:30:00Z"
  }
}
```

**Errors:**
- `403` - Solo admin
- `400` - Transizione non valida

---

#### DELETE `/reset`
**[ADMIN ONLY]** Elimina sessione corrente e tutti i dati

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Session reset successfully"
}
```

---

### 🎯 Gestione Eventi

#### GET `/events`
Ottieni tutti gli eventi della sessione corrente

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "description": "Qualcuno dice 'sinergia'",
      "points": 5,
      "displayOrder": 1,
      "happened": null,
      "predictionCount": 8
    },
    {
      "id": "uuid",
      "description": "Meeting in ritardo",
      "points": 3,
      "displayOrder": 2,
      "happened": null,
      "predictionCount": 5
    }
  ]
}
```

---

#### POST `/events`
**[ADMIN ONLY]** Crea nuovo evento

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "description": "Qualcuno dice 'sinergia'",
  "points": 5
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "description": "Qualcuno dice 'sinergia'",
    "points": 5,
    "displayOrder": 1
  }
}
```

**Errors:**
- `403` - Solo admin può creare eventi
- `400` - Sessione non in stato SETUP

---

#### PUT `/events/:eventId`
**[ADMIN ONLY]** Modifica evento

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "description": "Qualcuno dice 'sinergia' o 'leverage'",
  "points": 6
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "description": "Qualcuno dice 'sinergia' o 'leverage'",
    "points": 6
  }
}
```

---

#### DELETE `/events/:eventId`
**[ADMIN ONLY]** Elimina evento

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Event deleted"
}
```

---

#### PATCH `/events/:eventId/verify`
**[ADMIN ONLY]** Verifica se evento è accaduto

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "happened": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "happened": true
  }
}
```

**Errors:**
- `403` - Solo admin
- `400` - Sessione non in stato ACTIVE o CLOSED

---

#### PATCH `/events/verify-batch`
**[ADMIN ONLY]** Verifica multipli eventi in una volta

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "events": [
    { "id": "uuid-1", "happened": true },
    { "id": "uuid-2", "happened": false },
    { "id": "uuid-3", "happened": true }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "updated": 3
  }
}
```

---

### 🎲 Gestione Predizioni (User)

#### GET `/predictions/me`
Ottieni le mie predizioni per la sessione corrente

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "eventId": "uuid",
        "description": "Qualcuno dice 'sinergia'",
        "points": 5,
        "happened": null
      },
      {
        "eventId": "uuid",
        "description": "Meeting in ritardo",
        "points": 3,
        "happened": null
      }
    ],
    "count": 2,
    "maxAllowed": 5,
    "canAddMore": true
  }
}
```

---

#### POST `/predictions`
Salva/aggiorna le mie predizioni

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "eventIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3",
    "uuid-4",
    "uuid-5"
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "predictions": 5,
    "message": "Predictions saved successfully"
  }
}
```

**Errors:**
- `400` - Sessione non in stato OPEN
- `400` - Troppi eventi selezionati (max: 5)
- `404` - Evento non trovato

---

#### DELETE `/predictions/:eventId`
Rimuovi una predizione

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Prediction removed"
}
```

**Errors:**
- `400` - Sessione non in stato OPEN

---

### 🏆 Leaderboard e Statistiche

#### GET `/leaderboard`
Ottieni classifica finale

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "username": "Laura",
      "finalScore": 16,
      "eventsGuessed": 4,
      "totalPredictions": 5,
      "accuracyPercentage": 80.00,
      "rankPosition": 1
    },
    {
      "userId": "uuid",
      "username": "Mario",
      "finalScore": 13,
      "eventsGuessed": 3,
      "totalPredictions": 5,
      "accuracyPercentage": 60.00,
      "rankPosition": 2
    }
  ]
}
```

**Errors:**
- `400` - Sessione non conclusa

---

#### GET `/stats`
Statistiche sessione corrente

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "title": "Weekly Team Meeting",
    "state": "CLOSED",
    "totalParticipants": 12,
    "totalEvents": 8,
    "eventsHappened": 5,
    "eventsNotHappened": 3,
    "avgScore": 12.5,
    "maxScore": 18,
    "minScore": 5,
    "mostPredictedEvent": {
      "description": "Cane o gatto appare",
      "predictionCount": 10
    }
  }
}
```

---

#### GET `/my-score`
Il mio punteggio dettagliato

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "finalScore": 13,
    "eventsGuessed": 3,
    "totalPredictions": 5,
    "accuracyPercentage": 60.00,
    "rankPosition": 2,
    "predictions": [
      {
        "description": "Qualcuno dice 'sinergia'",
        "points": 5,
        "happened": true,
        "scored": true
      },
      {
        "description": "Meeting in ritardo",
        "points": 3,
        "happened": true,
        "scored": true
      },
      {
        "description": "Problema tecnico",
        "points": 4,
        "happened": false,
        "scored": false
      },
      {
        "description": "Cane appare",
        "points": 6,
        "happened": true,
        "scored": true
      },
      {
        "description": "Over 30 min",
        "points": 3,
        "happened": false,
        "scored": false
      }
    ]
  }
}
```

**Errors:**
- `400` - Sessione non conclusa

---

## Struttura Response Standard

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## HTTP Status Codes

- `200` OK - Richiesta successo
- `201` Created - Risorsa creata
- `400` Bad Request - Dati non validi
- `401` Unauthorized - Non autenticato
- `403` Forbidden - Non autorizzato (es. non admin)
- `404` Not Found - Risorsa non trovata
- `409` Conflict - Conflitto (es. sessione già esistente)
- `422` Unprocessable Entity - Validazione fallita
- `500` Internal Server Error - Errore server

---

## Autenticazione

Tutte le richieste protette richiedono header:
```
Authorization: Bearer {accessToken}
```

**Access Token:**
- Scade dopo 15 minuti
- Contiene: `userId`, `role`, `email`

**Refresh Token:**
- Scade dopo 7 giorni
- Usato per ottenere nuovo access token

---

## Rate Limiting

- **Auth endpoints**: 5 richieste/minuto per IP
- **Altri endpoints**: 100 richieste/minuto per utente

---

## CORS

Origini permesse (development):
- `http://localhost:3000`
- `http://localhost:5173`

---

## WebSocket (Opzionale - Real-time)

### Namespace: `/session`

**Eventi Client → Server:**
- `join_session` - Unisciti alla sessione corrente
- `leave_session` - Esci dalla sessione

**Eventi Server → Client:**
- `session_state_changed` - Stato sessione cambiato
- `new_participant` - Nuovo partecipante
- `predictions_closed` - Predizioni chiuse
- `leaderboard_ready` - Classifica disponibile

**Esempio:**
```javascript
socket.on('session_state_changed', (data) => {
  console.log('Nuovo stato:', data.state)
})
```

---
