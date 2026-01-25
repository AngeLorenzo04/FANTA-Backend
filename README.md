# 🔮 Fanta Backend - PredictGame API

Benvenuto nel backend di **PredictGame**, un'applicazione dinamica per gestire giochi di predizioni! 
Questo progetto fornisce le API RESTful per creare sessioni di gioco, gestire eventi, raccogliere predizioni dagli utenti e calcolare le classifiche in tempo reale.

🚀 **Hostato su Render** | 🗄️ **Database su Supabase** | 🌐 **Live su [predicgame.it](https://predicgame.it)**

---

## 📋 Indice
- [Panoramica](#-panoramica)
- [Funzionalità Principali](#-funzionalità-principali)
- [Stack Tecnologico](#-stack-tecnologico)
- [Flusso dell'Applicazione](#-flusso-dellapplicazione)
- [Schema del Database](#-schema-del-database)
- [Installazione e Avvio](#-installazione-e-avvio)

---

## 🌟 Panoramica

L'app permette agli utenti di partecipare a "Sessioni di Gioco" create dagli amministratori. Ogni sessione contiene una serie di eventi futuri. Gli utenti devono indovinare quali eventi si verificheranno. Punti vengono assegnati per ogni predizione corretta, scalando la classifica globale!

---

## ✨ Funzionalità Principali

*   **Autenticazione Sicura**: Registrazione e Login con JWT (JSON Web Tokens).
*   **Gestione Sessioni**: Ciclo di vita completo delle sessioni (Setup -> Aperta -> Attiva -> Conclusa).
*   **Eventi Dinamici**: Gli admin possono aggiungere eventi con punteggi variabili.
*   **Sistema di Predizioni**: Gli utenti selezionano gli eventi che credono accadranno.
*   **Classifiche in Tempo Reale**: Calcolo automatico dei punteggi basato sugli esiti degli eventi.
*   **Ruoli Utente**: Distinzione tra `USER` (giocatori) e `ADMIN` (gestori del gioco).

---

## 🛠 Stack Tecnologico

Il progetto è costruito con tecnologie moderne per garantire performance e scalabilità:

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Linguaggio**: [TypeScript](https://www.typescriptlang.org/)
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/) (ospitato su **Supabase**)
*   **Hosting**: [Render](https://render.com/)

---

## 🏗 Architettura a Microservizi

Il sistema è progettato seguendo un'architettura modulare che separa logicamente le diverse responsabilità in servizi distinti. Questa struttura facilita la scalabilità e la manutenzione del codice.

```mermaid
graph TD
    Client[Client (Frontend)] -->|HTTPS| Gateway[API Gateway / Express App]
    
    subgraph "Backend Services"
        Gateway -->|/auth| Auth[Auth Service]
        Gateway -->|/sessions| Session[Session Service]
        Gateway -->|/events| Event[Event Service]
        Gateway -->|/predictions| Pred[Prediction Service]
        Gateway -->|/leaderboard| Leader[Leaderboard Service]
    end
    
    Auth -->|Read/Write| DB[(PostgreSQL Database)]
    Session -->|Read/Write| DB
    Event -->|Read/Write| DB
    Pred -->|Read/Write| DB
    Leader -->|Read Only| DB
```

---

## 🔄 Flusso dell'Applicazione

Ecco come si svolge una tipica partita:

1.  **Creazione (SETUP)**: Un Admin crea una nuova `GameSession` e aggiunge vari `Event` (es. "Pioverà domani?", "La squadra X vincerà?").
2.  **Apertura (OPEN)**: L'Admin apre la sessione. Gli utenti possono vedere gli eventi e inviare le loro `Prediction`.
3.  **Gioco in Corso (ACTIVE)**: L'Admin chiude le predizioni. Nessuno può più scommettere. Gli eventi iniziano ad accadere nella realtà.
4.  **Esiti**: L'Admin aggiorna lo stato degli eventi (`happened: true/false`).
5.  **Conclusione (CLOSED)**: La sessione termina. I punteggi definitivi vengono calcolati e la `Leaderboard` è finalizzata.

---

## 🗄 Schema del Database

Il database è strutturato in modo relazionale per garantire l'integrità dei dati. Di seguito il diagramma Entity-Relationship (ER):

```mermaid
erDiagram
    User ||--o{ GameSession : "manages (Admin)"
    User ||--o{ Prediction : "makes"
    GameSession ||--o{ Event : "contains"
    Event ||--o{ Prediction : "has"
    
    User {
        UUID id PK
        String email
        String username
        String passwordHash
        Role role "ADMIN | USER"
    }
    
    GameSession {
        UUID id PK
        String title
        SessionState state "SETUP | OPEN | ACTIVE | CLOSED"
        Int maxPredictionsPerUser
        UUID adminId FK
    }
    
    Event {
        UUID id PK
        UUID sessionId FK
        String description
        Int points
        Boolean happened
    }
    
    Prediction {
        UUID id PK
        UUID userId FK
        UUID eventId FK
        DateTime createdAt
    }
```

Ecco le entità principali:

### 1. User (`users`)
Rappresenta gli utenti del sistema.
*   `id`: UUID
*   `email`, `username`: Credenziali
*   `role`: `ADMIN` o `USER`

### 2. GameSession (`game_session`)
Il contenitore di una partita.
*   `state`: `SETUP` -> `OPEN` -> `ACTIVE` -> `CLOSED`
*   `maxPredictionsPerUser`: Limite di predizioni per utente.

### 3. Event (`events`)
Un singolo evento su cui scommettere all'interno di una sessione.
*   `description`: Cosa potrebbe accadere.
*   `points`: Valore dell'evento.
*   `happened`: Booleano che indica se l'evento si è verificato (null se non ancora deciso).

### 4. Prediction (`predictions`)
La scommessa di un utente su un evento.
*   Collega `User` ed `Event`.
*   Se esiste, significa che l'utente prevede che l'evento accadrà.

---

## 🚀 Installazione e Avvio

Per eseguire il progetto in locale:

1.  **Clona la repository**:
    ```bash
    git clone <url-repository>
    cd FANTA-Backend
    ```

2.  **Installa le dipendenze**:
    ```bash
    npm install
    ```

3.  **Configura le variabili d'ambiente**:
    Crea un file `.env` e inserisci l'URL del tuo database Supabase:
    ```env
    DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
    JWT_SECRET="tua_chiave_segreta"
    PORT=3000
    ```

4.  **Avvia il server di sviluppo**:
    ```bash
    npm run dev
    ```

Il server sarà attivo su `http://localhost:3000`.

---

Developed with ❤️ for TechWeb
