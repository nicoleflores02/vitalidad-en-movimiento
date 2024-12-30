// renderer.js

// Función para descargar el PDF
const { jsPDF } = window.jspdf;
const doc = new jsPDF();

document.getElementById('download1').addEventListener('click', function () {
  const doc = new jsPDF();

  const personName = document.getElementById('personName1').textContent;
  const date = document.getElementById('date1').textContent;
  const time = document.getElementById('time1').textContent;
  const correctCount = document.getElementById('correctCount1').textContent;
  const incorrectCount = document.getElementById('incorrectCount1').textContent;
  const accuracy = document.getElementById('accuracy1').textContent;

  // Agregar información al PDF
  doc.text(`Informe de Ejercicio - ${personName}`, 10, 10);
  doc.text(date, 10, 20);
  doc.text(time, 10, 30);
  doc.text(correctCount, 10, 40);
  doc.text(incorrectCount, 10, 50);
  doc.text(accuracy, 10, 60);

  // Descargar el archivo PDF
  doc.save(`${personName}_informe.pdf`);
});

function generatePDF(personIndex) {
  // Usar la librería jsPDF correctamente con el nuevo nombre
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const personName = document.getElementById(`name${personIndex}`).textContent; 
  const date = document.getElementById(`date${personIndex}`).textContent;
  const time = document.getElementById(`time${personIndex}`).textContent;
  const correctCount = document.getElementById(`correctCount${personIndex}`).textContent;
  const incorrectCount = document.getElementById(`incorrectCount${personIndex}`).textContent;
  const accuracy = document.getElementById(`accuracy${personIndex}`).textContent;

  // Agregar información al PDF
  doc.text(`Informe de Ejercicio - ${personName}`, 10, 10);
  doc.text(date, 10, 20);
  doc.text(time, 10, 30);
  doc.text(correctCount, 10, 40);
  doc.text(incorrectCount, 10, 50);
  doc.text(accuracy, 10, 60);

  // Descargar el archivo PDF
  doc.save(`${personName}_informe.pdf`);
}

// Asignar evento de clic a cada botón de descarga
document.querySelectorAll('.downloadButton').forEach((button, index) => {
  button.addEventListener('click', () => generatePDF(index + 1));
});




// Obtener referencias a los elementos del DOM
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const exerciseGif = document.getElementById('exerciseGif');
const buttons = document.querySelectorAll('.buttons button');
const exerciseTitle = document.getElementById('exerciseTitle');

const correctCountElems = [
  document.getElementById('correctCount1'),
  document.getElementById('correctCount2'),
  document.getElementById('correctCount3')
];
const incorrectCountElems = [
  document.getElementById('incorrectCount1'),
  document.getElementById('incorrectCount2'),
  document.getElementById('incorrectCount3')
];
const timeElems = [
  document.getElementById('time1'),
  document.getElementById('time2'),
  document.getElementById('time3')
];
const accuracyElems = [
  document.getElementById('accuracy1'),
  document.getElementById('accuracy2'),
  document.getElementById('accuracy3')
];

const dateElems = [
  document.getElementById('date1'),
  document.getElementById('date2'),
  document.getElementById('date3')
]; 





// Variables para Pose Detection
let detector;
let detectorConfig = {
  modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING // Cambiamos a 'MULTIPOSE'
};

// Cargar el modelo de detección de poses
async function loadPoseModel() {
  try {
    detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    console.log("Modelo de detección de poses cargado.");
    detectMovementAndPose();
  } catch (error) {
    console.error("Error al cargar el modelo de detección de poses:", error);
  }
}

// Acceder a la cámara
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  } catch (err) {
    console.error("Error al acceder a la cámara: ", err);
    alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
  }
}

// Inicialización de las variables
let selectedButton = null;
let correctCount = [0, 0, 0]; // Almacena conteos de movimientos correctos para cada persona
let incorrectCount = [0, 0, 0]; // Almacena conteos de movimientos incorrectos
let lastDetectedCorrect = [false, false, false];
let lastDetectedIncorrect = [false, false, false]; // Estado de cada persona, true si el último movimiento fue incorrecto

let startTime = [null, null, null]; // Para capturar el inicio de cada ejercicio
let totalTime = [0, 0, 0]; // Tiempo total por persona

let isExerciseFinished = false; // Variable para controlar si el ejercicio se ha finalizado

// Función principal para detectar movimiento y poses de múltiples personas
async function detectMovementAndPose() {
  if (video.paused || video.ended) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Asignar fecha y hora generales (solo una vez por frame)
  const currentDate = new Date();
  const formattedDate = `Fecha y Hora: ${currentDate.toLocaleString()}`;
  dateElems.forEach(dateElem => dateElem.textContent = formattedDate);
  
  // Detectar poses de múltiples personas
  const poses = await detector.estimatePoses(video);
  
  poses.slice(0, 3).forEach((pose, index) => { // Limitamos a las primeras tres personas detectadas
    drawKeypoints(pose.keypoints, index);
    drawSkeleton(pose.keypoints);


    // Verificar ejercicio para cada persona
    if (selectedButton) {
      if (!startTime[index] && !isExerciseFinished) {
        startTime[index] = performance.now(); // Comienza el tiempo si no está iniciado
      }
      const gifName = selectedButton.getAttribute('data-gif');
      const isCorrect = recognizeExercise(pose.keypoints, gifName);

      // Si el movimiento es correcto y no se había detectado anteriormente como correcto
      if (isCorrect) {
        if (!lastDetectedCorrect[index]) {
          correctCount[index]++;  // Incrementar el contador de correctos
          lastDetectedCorrect[index] = true;  // Marcar que el movimiento fue correcto
          lastDetectedIncorrect[index] = false;  // Marcar que no es incorrecto
          
          // Actualizar el contador de correctos en el HTML
          const personContainer = document.getElementById(`person${index + 1}`);
          if (personContainer) {
            const correctCountElem = personContainer.querySelector(`#correctCount${index + 1}`);
            if (correctCountElem) {
              correctCountElem.textContent = `${users[index]} - Correctos: ${correctCount[index]}`;
            }
          }
        }
      } else if (!isCorrect) {
        if (!lastDetectedIncorrect[index]) {
          incorrectCount[index]++;  // Incrementar el contador de incorrectos
          lastDetectedIncorrect[index] = true;  // Marcar que el movimiento fue incorrecto
          lastDetectedCorrect[index] = false;  // Marcar que no es correcto
          
          // Actualizar el contador de incorrectos en el HTML
          const personContainer = document.getElementById(`person${index + 1}`);
          if (personContainer) {
            const incorrectCountElem = personContainer.querySelector(`#incorrectCount${index + 1}`);
            if (incorrectCountElem) {
              incorrectCountElem.textContent = `${users[index]} - Incorrectos: ${incorrectCount[index]}`;
            }
          }
        }
      }

      if (startTime[index] && !isExerciseFinished) {
        totalTime[index] = (performance.now() - startTime[index]) / 1000;
        // Actualizar el tiempo en el contenedor de la persona
        const personContainer = document.getElementById(`person${index + 1}`);
        if (personContainer) {
          const timeElem = personContainer.querySelector(`#time${index + 1}`);
          if (timeElem) {
            timeElem.textContent = `Tiempo por Ejercicio: ${totalTime[index].toFixed(2)} s`;
          }
        }
      }
    }

    

    // Calcular precisión y actualizar en el contenedor correspondiente
    const totalMovements = correctCount[index] + incorrectCount[index];
    const accuracy = totalMovements > 0 ? (correctCount[index] / totalMovements) * 100 : 0;
    
    const personContainer = document.getElementById(`person${index + 1}`);
    if (personContainer) {
      const accuracyElem = personContainer.querySelector(`#accuracy${index + 1}`);
      if (accuracyElem) {
        accuracyElem.textContent = `Precisión: ${accuracy.toFixed(2)}%`;
      }
    }
  });

  requestAnimationFrame(detectMovementAndPose);
}

// Obtener referencia al botón "Finalizar Ejercicio"
const finishButton = document.getElementById('finishButton');

// Evento para congelar el tiempo cuando se presiona el botón
finishButton.addEventListener('click', () => {
  isExerciseFinished = true; // Congelar el tiempo
  alert("Ejercicio Finalizado. El tiempo se ha congelado.");
  finalizarEjercicioParaUsuarios();
});

let users = [];  // Array donde se almacenarán los nombres de los usuarios

// Función para guardar los datos de cada ejercicio en el historial de cada usuario
export async function guardarEnHistorial(usuarioID, ejercicioData) {
  try {
    // Referencia a la colección 'historial' del usuario con su UID único
    const historialRef = collection(db, 'users', usuarioID, 'historial');
    
    // Guardar el ejercicio en el historial usando addDoc
    await addDoc(historialRef, {
      nombreEjercicio: ejercicioData.nombre,
      duracion: ejercicioData.duracion,
      movimientosCorrectos: ejercicioData.movimientosCorrectos,
      movimientosIncorrectos: ejercicioData.movimientosIncorrectos,
      precision: ejercicioData.precision,
      fecha: new Date()  // Fecha de realización
    });
    
    console.log("Ejercicio guardado en el historial para el usuario:", usuarioID);
  } catch (error) {
    console.error("Error al guardar el ejercicio para el usuario:", usuarioID, error);
  }
}

// Llamar a esta función cuando se termine el ejercicio para un usuario

function finalizarEjercicioParaUsuarios() {
  for (let index = 0; index < 3; index++) {
    // Obtener el nombre del ejercicio basado en el gifName seleccionado
    const ejercicioNombre = getExerciseName(selectedButton.getAttribute('data-gif'));

    const ejercicioData = {
      nombre: ejercicioNombre,  // Nombre del ejercicio basado en el gif
      duracion: totalTime[index],
      movimientosCorrectos: correctCount[index],
      movimientosIncorrectos: incorrectCount[index],
      precision: (correctCount[index] + incorrectCount[index] > 0)
        ? (correctCount[index] / (correctCount[index] + incorrectCount[index])) * 100
        : 0
    };

    const usuarioID = users[index]; // Suponiendo que 'users' contiene los UID de cada usuario

    // Verificar que el usuario esté autenticado antes de guardar en Firestore
    if (usuarioID) {
      // Llamamos a la función para guardar los datos en el historial de Firestore
      guardarEnHistorial(usuarioID, ejercicioData);
    } else {
      console.log("No hay un usuario autenticado.");
    }
  }
}

// Función para obtener los usuarios desde la base de datos (o localStorage)
function getUsersFromDatabase() {
  const usersData = JSON.parse(localStorage.getItem("usersData"));
  
  if (usersData && usersData.length === 3) {
    // Actualizamos el arreglo `users` con los nombres completos de cada usuario
    users = usersData.map(user => `${user.nombre} ${user.apellidoPaterno}`);

    // Si deseas, puedes también actualizar la interfaz con estos datos:
    usersData.forEach((user, index) => {
      const personContainer = document.getElementById(`person${index + 1}`);
      personContainer.querySelector("h3").textContent = `${user.nombre} ${user.apellidoPaterno}`;
    });
  } else {
    // En caso de que no haya datos o no sean 3 usuarios, asignamos nombres predeterminados
    users = ["Usuario 1", "Usuario 2", "Usuario 3"];
  }
}



// Función para dibujar keypoints para múltiples personas con colores distintos
function drawKeypoints(keypoints, index) {
  const colors = ['#00FF00', '#0000FF', '#FF00FF']; // Colores distintos para cada persona
  keypoints.forEach(keypoint => {
    if (keypoint.score > 0.5) {
      ctx.beginPath();
      ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = colors[index];
      ctx.fill();
    }
  });
   // Dibuja el nombre de la persona en el mismo color
   ctx.fillStyle = colors[index]; // Asigna el color para el texto (el mismo que el de los keypoints)
   ctx.font = '16px Arial'; // Establece el tamaño y tipo de fuente
   
   // Dibuja el nombre cerca del primer keypoint
   ctx.fillText(users[index], keypoints[0].x + 10, keypoints[0].y);
 }
 
 // Llamar a esta función después de que se hayan recuperado los usuarios de la base de datos
 getUsersFromDatabase();
 



// Función para dibujar el esqueleto en el canvas
function drawSkeleton(keypoints) {
  const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
  
  adjacentPairs.forEach(pair => {
    const partA = keypoints[pair[0]];
    const partB = keypoints[pair[1]];
    
    if (partA.score > 0.5 && partB.score > 0.5) {
      ctx.beginPath();
      ctx.moveTo(partA.x, partA.y);
      ctx.lineTo(partB.x, partB.y);
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// Manejo de botones para selección de ejercicios
buttons.forEach(button => {
  button.addEventListener('click', () => {
    const gifName = button.getAttribute('data-gif');
    loadExerciseGif(button, gifName);
    
    // Resaltar el botón seleccionado
    if (selectedButton) selectedButton.classList.remove('active');
    button.classList.add('active');
    selectedButton = button;

    // Actualizar contadores de ejercicios en la interfaz
    correctCount = [0, 0, 0];
    incorrectCount = [0, 0, 0];
    startTime = [null, null, null];
    correctCountElems.forEach((elem, i) => elem.textContent = `Persona ${i + 1} - Correctos: 0`);
    incorrectCountElems.forEach((elem, i) => elem.textContent = `Persona ${i + 1} - Incorrectos: 0`);
    timeElems.forEach((elem, i) => elem.textContent = `Tiempo por Ejercicio: 0.00 s`);
    accuracyElems.forEach((elem, i) => elem.textContent = `Precisión: 0.00%`);
  });
});

// Función para cargar el GIF del ejercicio seleccionado
function loadExerciseGif(button, gifName) {
  const gifPath = `assets/gifs/${gifName}.gif`;
  
  // Actualiza la fuente de la imagen
  exerciseGif.src = gifPath;
  
  // Actualiza el título del ejercicio
  exerciseTitle.textContent = getExerciseName(gifName);
  

}

// Función para obtener el nombre del ejercicio desde el gifName
function getExerciseName(gifName) {
  switch(gifName) {
    case 'Circulosconlosbrazos':
      return 'Círculos con los Brazos';
    case 'Elevacionesdebrazosfrontales':
      return 'Elevaciones de Brazos Frontales';
    case 'Elevacionesdebrazoslaterales':
      return 'Elevaciones de Brazos Laterales';
    case 'Encogimientodehombros':
      return 'Encogimiento de Hombros';
    case 'Estiramientodelcuello':
      return 'Estiramiento del Cuello';
    case 'Flexionlateraldeltronco':
      return 'Flexión Lateral del Tronco';
    // Añade más casos si agregas más ejercicios
    default:
      return 'Selecciona un ejercicio';
  }
}

// Función para reconocer el ejercicio basado en los keypoints
function recognizeExercise(keypoints, gifName) {
  switch(gifName) {
    case 'Circulosconlosbrazos':
      return detectCirculosconlosbrazos(keypoints);
    case 'Elevacionesdebrazosfrontales':
      return detectElevacionesdebrazosfrontales(keypoints);
    case 'Elevacionesdebrazoslaterales':
      return detectElevacionesdebrazoslaterales(keypoints);
    case 'Encogimientodehombros':
      return detectEncogimientodehombros(keypoints);
    case 'Estiramientodelcuello':
      return detectEstiramientodelcuello(keypoints);
    case 'Flexionlateraldeltronco':
      return detectFlexionlateraldeltronco(keypoints);
    default:
      return null;
  }
}

/// Variables para almacenar el estado anterior de los ejercicios
// Declaración global de `exerciseState` que contiene el estado de cada ejercicio detectado
let exerciseState = {
  Circulosconlosbrazos: false,
  Elevacionesdebrazosfrontales: false,
  Elevacionesdebrazoslaterales: false,
  Encogimientodehombros: false,
  Estiramientodelcuello: false,
  Flexionlateraldeltronco: false
};

// Función para detectar "Encogimiento de hombros"
function detectEncogimientodehombros(keypoints) {
  // Obtenemos las posiciones de los hombros
  const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
  const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
  
  if (leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
    // Calculamos la altura de los hombros
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    
    // Suponiendo que cuando los hombros se encogen, la altura disminuye
    // Necesitamos un umbral para determinar si los hombros están encogidos
    const encogidoThreshold = 200; // Ajusta este valor según las pruebas
    
    if (shoulderY < encogidoThreshold) {
      if (!exerciseState.Encogimientodehombros) {
        exerciseState.Encogimientodehombros = true;
        return true; // Movimiento correcto detectado
      }
    } else {
      exerciseState.Encogimientodehombros = false;
    }
  }
  
  return false; // Movimiento no detectado
}

// Implementación básica de detección de "Estiramiento del Cuello"
function detectEstiramientodelcuello(keypoints) {
  // Obtenemos las posiciones de la cabeza y el cuello
  const nose = keypoints.find(k => k.name === 'nose');
  const leftEye = keypoints.find(k => k.name === 'left_eye');
  const rightEye = keypoints.find(k => k.name === 'right_eye');
  
  if (nose.score > 0.5 && leftEye.score > 0.5 && rightEye.score > 0.5) {
    // Calculamos la inclinación del cuello
    const deltaX = rightEye.x - leftEye.x;
    const deltaY = rightEye.y - leftEye.y;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Suponiendo que un estiramiento hacia la izquierda o derecha cambia el ángulo
    const estiramientoThreshold = 15; // Grados, ajusta según pruebas
    
    if (angle > estiramientoThreshold || angle < -estiramientoThreshold) {
      if (!exerciseState.Estiramientodelcuello) {
        exerciseState.Estiramientodelcuello = true;
        return true; // Movimiento correcto detectado
      }
    } else {
      exerciseState.Estiramientodelcuello = false;
    }
  }
  
  return false; // Movimiento no detectado
}

// Implementación básica de detección de "Flexión Lateral del Tronco"
function detectFlexionlateraldeltronco(keypoints) {
  // Obtenemos las posiciones de la cintura y la mano
  const leftHip = keypoints.find(k => k.name === 'left_hip');
  const rightHip = keypoints.find(k => k.name === 'right_hip');
  const leftWrist = keypoints.find(k => k.name === 'left_wrist');
  const rightWrist = keypoints.find(k => k.name === 'right_wrist');
  
  if ((leftHip.score > 0.5 && leftWrist.score > 0.5) || 
      (rightHip.score > 0.5 && rightWrist.score > 0.5)) {
    
    // Calcular la inclinación del tronco hacia la izquierda o derecha
    const hip = leftHip.score > rightHip.score ? leftHip : rightHip;
    const wrist = leftWrist.score > rightWrist.score ? leftWrist : rightWrist;
    
    const deltaX = wrist.x - hip.x;
    const deltaY = wrist.y - hip.y;
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Suponiendo que una flexión lateral cambia el ángulo significativamente
    const flexionThreshold = 20; // Grados, ajusta según pruebas
    
    if (angle > flexionThreshold || angle < -flexionThreshold) {
      if (!exerciseState.Flexionlateraldeltronco) {
        exerciseState.Flexionlateraldeltronco = true;
        return true; // Movimiento correcto detectado
      }
    } else {
      exerciseState.Flexionlateraldeltronco = false;
    }
  }
  
  return false; // Movimiento no detectado
}

// Implementación básica de detección de "Círculos con los Brazos"
// Nota: La detección de círculos requiere seguimiento del movimiento a lo largo del tiempo.
// Aquí proporcionamos una lógica muy simplificada que debe ser mejorada.
let circlesCounter = 0;
let lastDirectionX = null;
let lastDirectionY = null;

function detectCirculosconlosbrazos(keypoints) {
  // Obtener las posiciones de las manos
  const leftWrist = keypoints.find(k => k.name === 'left_wrist');
  const rightWrist = keypoints.find(k => k.name === 'right_wrist');
  
  if (leftWrist.score > 0.5 && rightWrist.score > 0.5) {
    // Calcular el movimiento promedio de ambas manos
    const avgWristX = (leftWrist.x + rightWrist.x) / 2;
    const avgWristY = (leftWrist.y + rightWrist.y) / 2;

    // Calcular la dirección en `x` e `y` del movimiento
    const directionX = avgWristX > lastDirectionX ? 'right' : 'left';
    const directionY = avgWristY > lastDirectionY ? 'up' : 'down';

    // Verificar si hay un cambio en ambas direcciones (indica un cuarto de círculo)
    if (lastDirectionX && lastDirectionY) {
      if ((lastDirectionX !== directionX && lastDirectionY !== directionY) || 
          (lastDirectionX === directionX && lastDirectionY !== directionY)) {
        circlesCounter++;
        
        // Completar un círculo cada 4 cambios de dirección (simplificado)
        if (circlesCounter >= 4) {
          circlesCounter = 0;
          return true; // Círculo completo detectado
        }
      }
    }
    
    // Guardar la última posición
    lastDirectionX = avgWristX;
    lastDirectionY = avgWristY;
  }
  
  return false; // No se detectó un círculo completo
}
      
      // Implementación básica de detección de "Elevaciones de Brazos Frontales"
      function detectElevacionesdebrazosfrontales(keypoints) {
        const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
        const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
        const leftWrist = keypoints.find(k => k.name === 'left_wrist');
        const rightWrist = keypoints.find(k => k.name === 'right_wrist');
      
        if (leftShoulder.score > 0.5 && rightShoulder.score > 0.5 && 
            leftWrist.score > 0.5 && rightWrist.score > 0.5) {
            
          const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
          const wristY = (leftWrist.y + rightWrist.y) / 2;
      
          // Suponiendo que la elevación frontal se detecta si la muñeca está por encima de los hombros
          if (wristY < shoulderY - 50) { // Ajusta el umbral según sea necesario
            if (!exerciseState.Elevacionesdebrazosfrontales) {
              exerciseState.Elevacionesdebrazosfrontales = true;
              return true; // Movimiento correcto detectado
            }
          } else {
            exerciseState.Elevacionesdebrazosfrontales = false;
          }
        }
        
        return false; // Movimiento no detectado
      }
      
      // Implementación básica de detección de "Elevaciones de Brazos Laterales"
      function detectElevacionesdebrazoslaterales(keypoints) {
        const leftShoulder = keypoints.find(k => k.name === 'left_shoulder');
        const rightShoulder = keypoints.find(k => k.name === 'right_shoulder');
        const leftWrist = keypoints.find(k => k.name === 'left_wrist');
        const rightWrist = keypoints.find(k => k.name === 'right_wrist');
      
        if (leftShoulder.score > 0.5 && rightShoulder.score > 0.5 && 
            leftWrist.score > 0.5 && rightWrist.score > 0.5) {
            
          const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
          const leftWristY = leftWrist.y;
          const rightWristY = rightWrist.y;
      
          // Detectar si ambos brazos están elevados hacia los lados
          if (leftWristY < shoulderY - 50 && rightWristY < shoulderY - 50) {
            if (!exerciseState.Elevacionesdebrazoslaterales) {
              exerciseState.Elevacionesdebrazoslaterales = true;
              return true; // Movimiento correcto detectado
            }
          } else {
            exerciseState.Elevacionesdebrazoslaterales = false;
          }
        }
        
        return false; // Movimiento no detectado
      }
      
      // Inicializar todo
      async function init() {
        await setupCamera();
        await loadPoseModel();
      }
      
      init(); // Iniciar la aplicación
      
