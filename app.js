// Firebase Config
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Auth
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const logoutBtn = document.getElementById("logout-btn");

signupForm.addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signup successful!"))
    .catch(err => alert(err.message));
});

loginForm.addEventListener("submit", e => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => { alert("Login successful!"); logoutBtn.classList.remove("hidden"); })
    .catch(err => alert(err.message));
});

logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    alert("Logged out");
    logoutBtn.classList.add("hidden");
  });
});

// Posts
const postsContainer = document.getElementById("posts-container");
document.getElementById("post-form").addEventListener("submit", e => {
  e.preventDefault();
  const content = document.getElementById("post-content").value;
  const user = auth.currentUser ? auth.currentUser.email : "Anonymous";
  db.collection("posts").add({ content, user, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
  document.getElementById("post-content").value="";
});

db.collection("posts").orderBy("timestamp","desc").onSnapshot(snapshot => {
  postsContainer.innerHTML="";
  snapshot.forEach(doc => {
    const post = doc.data();
    const div = document.createElement("div");
    div.className="post";
    div.innerHTML=`<strong>${post.user}:</strong> ${post.content}`;
    postsContainer.appendChild(div);
  });
});

// Chat
const chatContainer = document.getElementById("chat-container");
document.getElementById("chat-form").addEventListener("submit", e => {
  e.preventDefault();
  const message = document.getElementById("chat-message").value;
  const user = auth.currentUser ? auth.currentUser.email : "Anonymous";
  db.collection("chats").add({ message, user, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
  document.getElementById("chat-message").value="";
});

db.collection("chats").orderBy("timestamp","asc").onSnapshot(snapshot => {
  chatContainer.innerHTML="";
  snapshot.forEach(doc => {
    const chat = doc.data();
    const div = document.createElement("div");
    div.innerHTML=`<strong>${chat.user}:</strong> ${chat.message}`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
});

// Search
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  searchResults.innerHTML="";
  if (!query) return;

  db.collection("posts").get().then(snapshot => {
    snapshot.forEach(doc => {
      const post = doc.data();
      if(post.content.toLowerCase().includes(query)){
        const div = document.createElement("div");
        div.innerHTML=`<strong>Post:</strong> ${post.content}`;
        searchResults.appendChild(div);
      }
    });
  });

  db.collection("chats").get().then(snapshot => {
    const users = new Set();
    snapshot.forEach(doc => {
      const chat = doc.data();
      if(chat.user.toLowerCase().includes(query)) users.add(chat.user);
    });
    users.forEach(user => {
      const div = document.createElement("div");
      div.innerHTML=`<strong>User:</strong> ${user}`;
      searchResults.appendChild(div);
    });
  });
});

// Location
const shareLocationBtn = document.getElementById("share-location-btn");
let map;
shareLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) return alert("Geolocation not supported");
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    map = new google.maps.Map(document.getElementById("map"), { center: {lat, lng}, zoom: 15 });
    new google.maps.Marker({ position: {lat, lng}, map, title: "You are here!" });
    const user = auth.currentUser ? auth.currentUser.email : "Anonymous";
    db.collection("locations").add({ user, latitude: lat, longitude: lng, timestamp:firebase.firestore.FieldValue.serverTimestamp() });
  });
});

// Payment (Flutterwave)
const payBtn = document.getElementById("pay-btn");
payBtn.addEventListener("click", () => {
  const user = auth.currentUser ? auth.currentUser.email : "Anonymous";
  FlutterwaveCheckout({
    public_key: "YOUR_PUBLIC_KEY",
    tx_ref: "TX_" + Date.now(),
    amount: 5000,
    currency: "UGX",
    payment_options: "mobilemoneyuganda",
    customer: { email: user, name: user },
    callback: function(data){
      alert("Payment successful! ID: " + data.transaction_id);
      db.collection("payments").add({ user, amount:10, currency:"UGX", transaction_id:data.transaction_id, timestamp:firebase.firestore.FieldValue.serverTimestamp() });
    },
    onclose: function(){},
    customizations: { title:"iPrincesses Premium", description:"Upgrade to premium", logo:"https://your-logo.png" }
  });
});
