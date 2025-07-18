# AetherVerse 🌐

**AetherVerse** is a futuristic, multiplayer 2D metaverse built with **React**, **PixiJS**, **Node.js**, and **Socket.IO**. It offers interactive spaces like virtual offices and Spacestation where users can move, interact, and collaborate in real-time.

---

## 🚀 Features

- 🧑‍🚀 Custom animated player avatars
- 🗺️ Multiple map support (e.g. Office, SpaceShip)
- 🪑 Interactive furniture and smart systems
- 💬 Real-time multiplayer with emotes and selectable avatars
- 🛠️ Admin toolbar with hack controls
- 🔐 OTP-based email authentication
- 🏠 Space creation and management

---

## 🧱 Tech Stack

| Frontend     | Backend         | Real-Time | Auth/DB    | Animation/UI  |
|--------------|----------------|-----------|------------|----------------|
| React        | Node.js + Express | Socket.IO | MongoDB + OTP | PixiJS + CSS |

---

## 📸 Screenshots

> ✨ Explore the immersive world of Sethervse!

### 1. **Login & OTP Verification**
![Login](https://github.com/sinster23/Screenshots/blob/main/Aetherverse%20ss/ss1.png)
![SignUp](https://github.com/sinster23/Screenshots/blob/main/Aetherverse%20ss/ss2.png)

### 2. **Dashboard and Space Creation**
![Dashboard](https://github.com/sinster23/Screenshots/blob/main/Aetherverse%20ss/ss3.png)
![Create Space](https://github.com/sinster23/Screenshots/blob/main/Aetherverse%20ss/ss4.png)

### 3. **Office Space Map**
![Office Map](https://github.com/sinster23/Screenshots/blob/main/Aetherverse%20ss/ss5.png)
![Office Interactions](https://github.com/sinster23/Screenshots/blob/main/Aetherverse%20ss/ss7.png)

### 4. **Spacestation Map**
![Spacestation Map](https://github.com/sinster23/Screenshots/blob/main/Aetherverse%20ss/ss6.png)
![Spacestation Interactions](https://github.com/sinster23/Screenshots/blob/main/Aetherverse%20ss/ss8.png)

---

## 🧪 Getting Started (Local Setup)

```bash
# Clone the repository
git clone https://github.com/sinster23/2d-metaverse.git
cd 2d-metaverse

# Install dependencies
npm install

# Start backend
cd server
npm install
npm run dev

# Start frontend
cd ../client
npm install
npm start

# Populate .env file with your own values
PORT=
MONGO_URI=
JWT_SECRET=
MAIL_USER=
MAIL_PASS=

```

---

## 📬 Folder Structure

```
/client         # React + PixiJS Frontend
/server         # Node.js Backend

```

---

## 🛡️ Authentication Flow

- Users register with username/email/password

- OTP sent to email (expires in 10 mins)

- On success, redirected to dashboard and persistent login is maintained via JWT/localStorage

---

## ✨ Future Plans

- Voice and chat integration

- Profile page customization

- More map varieties

---

## 🙌 Acknowledgements

Inspired by classic MMO game mechanics and pixel-art metaverses like Habbo, Gather, and Club Penguin — reimagined for the modern web.

---

## 📝 License

Made with 💙 by Upayan & Subhayan
Drop a ⭐ if you like the project!






