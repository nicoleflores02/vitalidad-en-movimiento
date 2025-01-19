import { auth, db, analytics } from './firebaseConfig.js';
import { createUserWithEmailAndPassword ,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, setDoc, collection, addDoc, onSnapshot, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
// Estado para almacenar usuarios seleccionados
const selectedUsers = [];
// Verificar y actualizar el token del usuario autenticado
onAuthStateChanged(auth, (user) => {
  if (user) {
    user.getIdToken(true) // Actualiza el token
      .then((token) => {
        console.log("Token actualizado:", token);
      })
      .catch((error) => {
        console.error("Error al actualizar el token:", error);
      });
  } else {
    console.log("No hay usuario autenticado.");
  }
});

// Validación avanzada de cédula ecuatoriana
function validarCedulaEcuatoriana(cedula) {
  if (cedula.length !== 10 || isNaN(cedula)) return false;
  const digitos = cedula.split('').map(Number);
  const verificador = digitos.pop();
  const suma = digitos.reduce((acc, digito, index) => {
    let multiplicado = digito * (index % 2 === 0 ? 2 : 1);
    return acc + (multiplicado > 9 ? multiplicado - 9 : multiplicado);
  }, 0);
  const digitoCalculado = (10 - (suma % 10)) % 10;
  return verificador === digitoCalculado;
}

// Evento para buscar usuarios
document.getElementById("searchButton").addEventListener("click", async () => {
  const searchInput = document.getElementById("searchInput").value.trim();
  const usersSelect = document.getElementById("userSelect");

  // Limpia las opciones actuales
  usersSelect.innerHTML = '<option value="" disabled>Seleccionar...</option>';

  if (!searchInput) {
    alert("Por favor, ingresa un nombre o cédula para buscar.");
    return;
  }

  try {
    // Realiza la consulta en Firebase
    const usersRef = collection(db, "users");
    const searchQuery = query(
      usersRef,
      where("nombre", ">=", searchInput),
      where("nombre", "<=", searchInput + "\uf8ff")
    );

    const cedulaQuery = query(usersRef, where("cedula", "==", searchInput));

    const [nameSnapshot, cedulaSnapshot] = await Promise.all([
      getDocs(searchQuery),
      getDocs(cedulaQuery)
    ]);

    // Combina los resultados de ambas consultas
    const results = [];
    nameSnapshot.forEach(doc => results.push(doc.data()));
    cedulaSnapshot.forEach(doc => results.push(doc.data()));

    if (results.length === 0) {
      alert("No se encontraron usuarios con ese nombre o cédula.");
      return;
    }

    // Agrega los resultados al select
    results.forEach(user => {
      const option = document.createElement("option");
      option.value = JSON.stringify(user);
      option.textContent = `${user.nombre} ${user.apellidoPaterno} (${user.cedula})`;
      usersSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    alert("Hubo un error al buscar usuarios. Por favor, inténtalo nuevamente.");
  }
});

// Manejo de selección de usuarios
document.getElementById("userSelect").addEventListener("change", (event) => {
  const selectedOption = event.target.selectedOptions[0];
  if (!selectedOption) return;

  const user = JSON.parse(selectedOption.value);

  // Evita duplicados
  if (selectedUsers.find((u) => u.cedula === user.cedula)) {
    alert("Este usuario ya ha sido seleccionado.");
    return;
  }

  selectedUsers.push(user);

  // Actualiza la lista de usuarios seleccionados
  updateSelectedUsersList();
});

// Actualiza la visualización de usuarios seleccionados
function updateSelectedUsersList() {
  const selectedList = document.getElementById("selectedUsersList");
  selectedList.innerHTML = ""; // Limpia la lista actual

  selectedUsers.forEach((user, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `${user.nombre} ${user.apellidoPaterno} (${user.cedula})`;
    const removeButton = document.createElement("button");
    removeButton.textContent = "X";
    removeButton.addEventListener("click", () => {
      selectedUsers.splice(index, 1);
      updateSelectedUsersList();
    });
    listItem.appendChild(removeButton);
    selectedList.appendChild(listItem);
  });
}

// Manejo del botón de iniciar sesión
document.getElementById("loadUserButton").addEventListener("click", () => {
  if (selectedUsers.length < 3) {
    alert(`Debes seleccionar al menos 3 usuarios. Has seleccionado ${selectedUsers.length}.`);
    return;
  }

  try {
    localStorage.setItem("usersData", JSON.stringify(selectedUsers));
    alert(
      "Usuarios seleccionados: " +
        selectedUsers.map((u) => u.nombre).join(", ") +
        ". Redirigiendo..."
    );
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error al almacenar datos de usuarios:", error);
    alert("Hubo un error al guardar la selección. Intenta de nuevo.");
  }
});

// Actualización en tiempo real de la lista de usuarios
function listenForUsers() {
  const usersSelect = document.getElementById("userSelect");

  // Escuchar los cambios en la colección 'users'
  const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
    // Limpia las opciones actuales
    usersSelect.innerHTML = '<option value="" disabled>Seleccionar...</option>';
    snapshot.forEach((doc) => {
      const user = doc.data();
      const option = document.createElement("option");
      option.value = JSON.stringify(user);
      option.textContent = `${user.nombre} ${user.apellidoPaterno} (${user.cedula})`;
      usersSelect.appendChild(option);
    });
  }, (error) => {
    console.error("Error al escuchar cambios en usuarios:", error);
  });

  // Retornar la función para desuscribirse si es necesario
  return unsubscribe;
}

// Manejo de selección múltiple
document.getElementById("loadUserButton").addEventListener("click", () => {
  const selectedOptions = Array.from(document.getElementById("userSelect").selectedOptions);

  if (selectedOptions.length !== 3) {
    alert("Debes seleccionar exactamente 3 usuarios.");
    return;
  }

  const usersData = selectedOptions.map((option) => JSON.parse(option.value));
  try {
    localStorage.setItem("usersData", JSON.stringify(usersData));
    alert("Usuarios seleccionados: " + usersData.map(u => u.nombre).join(", ") + ". Redirigiendo...");
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error al almacenar datos de usuarios:", error);
    alert("Hubo un error al guardar la selección. Intenta de nuevo.");
  }
});

// Registro de usuarios
document.getElementById("registerForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const segundoNombre = document.getElementById("segundoNombre").value;
  const apellidoPaterno = document.getElementById("apellidoPaterno").value;
  const apellidoMaterno = document.getElementById("apellidoMaterno").value;
  const cedulaRegister = document.getElementById("cedulaRegister").value;

  if (!nombre || !apellidoPaterno || !cedulaRegister) {
    alert("Por favor, completa todos los campos obligatorios.");
    return;
  }

  if (!validarCedulaEcuatoriana(cedulaRegister)) {
    alert("La cédula ingresada no es válida.");
    return;
  }

  try {
    // Registro de usuario en Firebase Authentication
    const email = `${cedulaRegister}@fakeemail.com`;
    const password = cedulaRegister;

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log("Usuario registrado:", user.uid); // Para depuración
  // Crear documento del usuario en Firestore
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      nombre,
      segundoNombre,
      apellidoPaterno,
      apellidoMaterno,
      cedula: String(cedulaRegister).trim(),  // Asegúrate de que no tenga espacios
      createdAt: new Date().toISOString(),
      uid: user.uid  // Guardamos el UID en el documento
    });

    console.log("Documento del usuario creado en Firestore."); // Depuración

    // Crear subcolección 'historial'
    const historialRef = collection(db, `users/${user.uid}/historial`);
    await addDoc(historialRef, {
      mensaje: "Historial inicial creado.",
      fecha: new Date().toISOString(),
    });
    

    console.log("Historial creado exitosamente."); // Depuración

    alert("Registro exitoso. Ahora puedes iniciar sesión.");
    limpiarFormulario();
  } catch (error) {
    console.error("Error en el registro:", error.message);
    let errorMessage = "Error desconocido.";
    switch (error.code) {
      case "auth/email-already-in-use":
        errorMessage = "Ya existe un usuario registrado con esta cédula.";
        break;
      case "auth/weak-password":
        errorMessage = "La contraseña es demasiado débil.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Error de red. Verifica tu conexión a Internet.";
        break;
    }
    alert("Error en el registro: " + errorMessage);
  }
});


function limpiarFormulario() {
  document.getElementById("nombre").value = "";
  document.getElementById("segundoNombre").value = "";
  document.getElementById("apellidoPaterno").value = "";
  document.getElementById("apellidoMaterno").value = "";
  document.getElementById("cedulaRegister").value = "";
}


// Actualizar historial con datos de la sesión
async function agregarSesionAlHistorial(userUID, datosSesion) {
  try {
    if (!userUID || !datosSesion) {
      throw new Error("Datos insuficientes para agregar sesión.");
    }

    const historialRef = collection(db, `users/${userUID}/historial`);
    await addDoc(historialRef, datosSesion);
    console.log("Sesión agregada al historial.");
  } catch (error) {
    console.error("Error al agregar sesión al historial:", error);
  }
}
// Iniciar la escucha en tiempo real
listenForUsers();
