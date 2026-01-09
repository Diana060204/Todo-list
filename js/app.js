// ===================================
// ESTADO DE LA APLICACIÓN
// ===================================
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

// ===================================
// ELEMENTOS DEL DOM
// ===================================
const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const totalTasksEl = document.getElementById('totalTasks');
const pendingTasksEl = document.getElementById('pendingTasks');
const completedTasksEl = document.getElementById('completedTasks');
const filterButtons = document.querySelectorAll('.filter-btn');

// ===================================
// INICIALIZACIÓN
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadTasksFromLocalStorage();
    renderTasks();
    updateStats();
    setupEventListeners();
    createFloatingElements();
});

// ===================================
// CREAR ELEMENTOS FLOTANTES DINÁMICOS
// ===================================
function createFloatingElements() {
    // Crear partículas adicionales de forma dinámica
    setInterval(() => {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.fontSize = '1.5rem';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = '100vh';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1';
        particle.textContent = ['✨', '💖', '🌸', '🦋', '💕'][Math.floor(Math.random() * 5)];
        particle.style.animation = `float ${10 + Math.random() * 10}s linear`;
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 20000);
    }, 5000);
}

// ===================================
// CONFIGURAR EVENT LISTENERS
// ===================================
function setupEventListeners() {
    // Evento para agregar tarea
    taskForm.addEventListener('submit', handleAddTask);

    // Eventos para filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterChange);
    });
}

// ===================================
// MANEJAR AGREGAR TAREA
// ===================================
function handleAddTask(event) {
    event.preventDefault();
    
    const taskText = taskInput.value.trim();
    
    // Validar que no esté vacío
    if (taskText === '') {
        showValidationError();
        return;
    }

    // Crear nueva tarea
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };

    // Agregar a la lista
    tasks.push(newTask);

    // Limpiar input
    taskInput.value = '';

    // Guardar en localStorage
    saveTasksToLocalStorage();

    // Actualizar UI con animación
    renderTasks();
    updateStatsWithAnimation();

    // Feedback visual
    taskInput.focus();
    showSuccessAnimation();
}

// ===================================
// ANIMACIÓN DE ÉXITO
// ===================================
function showSuccessAnimation() {
    const successEmoji = document.createElement('div');
    successEmoji.textContent = '✨';
    successEmoji.style.position = 'fixed';
    successEmoji.style.top = '50%';
    successEmoji.style.left = '50%';
    successEmoji.style.transform = 'translate(-50%, -50%)';
    successEmoji.style.fontSize = '5rem';
    successEmoji.style.zIndex = '1000';
    successEmoji.style.animation = 'successPop 1s ease forwards';
    successEmoji.style.pointerEvents = 'none';
    
    document.body.appendChild(successEmoji);
    
    setTimeout(() => successEmoji.remove(), 1000);
}

// ===================================
// VALIDACIÓN DE INPUT
// ===================================
function showValidationError() {
    taskInput.style.borderColor = 'var(--pink-600)';
    taskInput.style.animation = 'shake 0.5s ease';
    taskInput.placeholder = '⚠️ Por favor, escribe una tarea';
    
    setTimeout(() => {
        taskInput.style.borderColor = '';
        taskInput.style.animation = '';
        taskInput.placeholder = 'Escribe una nueva tarea mágica...';
    }, 2000);
}

// ===================================
// RENDERIZAR TAREAS
// ===================================
function renderTasks() {
    // Limpiar lista
    taskList.innerHTML = '';

    // Filtrar tareas según filtro actual
    const filteredTasks = getFilteredTasks();

    // Verificar si hay tareas
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    // Renderizar cada tarea con un pequeño delay para efecto cascada
    filteredTasks.forEach((task, index) => {
        setTimeout(() => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        }, index * 50);
    });
}

// ===================================
// CREAR ELEMENTO DE TAREA
// ===================================
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => handleToggleTask(task.id));

    // Texto de la tarea
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    taskText.contentEditable = false;
    taskText.dataset.taskId = task.id;
    
    // Doble click para editar
    taskText.addEventListener('dblclick', () => handleStartEdit(task.id, taskText));
    
    // Enter para guardar edición
    taskText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveEdit(task.id, taskText);
        }
        if (e.key === 'Escape') {
            handleCancelEdit(taskText);
        }
    });

    // Contenedor de acciones
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'task-actions';

    // Botón editar
    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.innerHTML = '✏️ Editar';
    editBtn.addEventListener('click', () => handleStartEdit(task.id, taskText));

    // Botón eliminar
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.innerHTML = '🗑️ Eliminar';
    deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));

    // Ensamblar elementos
    actionsContainer.appendChild(editBtn);
    actionsContainer.appendChild(deleteBtn);
    
    li.appendChild(checkbox);
    li.appendChild(taskText);
    li.appendChild(actionsContainer);

    return li;
}

// ===================================
// INICIAR EDICIÓN DE TAREA
// ===================================
function handleStartEdit(taskId, taskTextElement) {
    // Si ya hay una edición en curso, cancelarla
    if (editingTaskId !== null) {
        const previousEdit = document.querySelector(`[data-task-id="${editingTaskId}"]`);
        if (previousEdit) {
            handleCancelEdit(previousEdit);
        }
    }

    editingTaskId = taskId;
    taskTextElement.contentEditable = true;
    taskTextElement.classList.add('editing');
    taskTextElement.focus();
    
    // Seleccionar todo el texto
    const range = document.createRange();
    range.selectNodeContents(taskTextElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

// ===================================
// GUARDAR EDICIÓN DE TAREA
// ===================================
function handleSaveEdit(taskId, taskTextElement) {
    const newText = taskTextElement.textContent.trim();
    
    if (newText === '') {
        showValidationError();
        return;
    }

    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, text: newText };
        }
        return task;
    });

    taskTextElement.contentEditable = false;
    taskTextElement.classList.remove('editing');
    editingTaskId = null;

    saveTasksToLocalStorage();
    renderTasks();
    
    // Animación de guardado
    showEditSuccessAnimation();
}

// ===================================
// CANCELAR EDICIÓN
// ===================================
function handleCancelEdit(taskTextElement) {
    const task = tasks.find(t => t.id === editingTaskId);
    if (task) {
        taskTextElement.textContent = task.text;
    }
    
    taskTextElement.contentEditable = false;
    taskTextElement.classList.remove('editing');
    editingTaskId = null;
}

// ===================================
// ANIMACIÓN DE EDICIÓN EXITOSA
// ===================================
function showEditSuccessAnimation() {
    const successEmoji = document.createElement('div');
    successEmoji.textContent = '💫';
    successEmoji.style.position = 'fixed';
    successEmoji.style.top = '50%';
    successEmoji.style.left = '50%';
    successEmoji.style.transform = 'translate(-50%, -50%)';
    successEmoji.style.fontSize = '4rem';
    successEmoji.style.zIndex = '1000';
    successEmoji.style.animation = 'successPop 0.8s ease forwards';
    successEmoji.style.pointerEvents = 'none';
    
    document.body.appendChild(successEmoji);
    
    setTimeout(() => successEmoji.remove(), 800);
}

// ===================================
// MARCAR/DESMARCAR TAREA
// ===================================
function handleToggleTask(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });

    saveTasksToLocalStorage();
    renderTasks();
    updateStatsWithAnimation();
    
    // Celebración si se completa una tarea
    const task = tasks.find(t => t.id === taskId);
    if (task && task.completed) {
        celebrate();
    }
}

// ===================================
// ANIMACIÓN DE CELEBRACIÓN
// ===================================
function celebrate() {
    const emojis = ['🎉', '🎊', '✨', '🌟', '💖', '🎈'];
    
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const emoji = document.createElement('div');
            emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            emoji.style.position = 'fixed';
            emoji.style.left = Math.random() * 100 + '%';
            emoji.style.top = '-50px';
            emoji.style.fontSize = '2rem';
            emoji.style.zIndex = '1000';
            emoji.style.pointerEvents = 'none';
            emoji.style.animation = 'fall 2s linear forwards';
            
            document.body.appendChild(emoji);
            
            setTimeout(() => emoji.remove(), 2000);
        }, i * 100);
    }
}

// ===================================
// ELIMINAR TAREA
// ===================================
function handleDeleteTask(taskId) {
    // Confirmación con estilo
    const confirmed = confirm('💔 ¿Estás segura de que deseas eliminar esta hermosa tarea?');
    
    if (!confirmed) {
        return;
    }

    // Animación de eliminación
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    if (taskElement) {
        taskElement.style.animation = 'slideOutRight 0.5s ease forwards';
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasksToLocalStorage();
            renderTasks();
            updateStatsWithAnimation();
        }, 500);
    }
}

// ===================================
// CAMBIAR FILTRO
// ===================================
function handleFilterChange(event) {
    const filterValue = event.target.dataset.filter;
    
    // Actualizar filtro actual
    currentFilter = filterValue;

    // Actualizar botones activos
    filterButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Renderizar tareas filtradas
    renderTasks();
}

// ===================================
// OBTENER TAREAS FILTRADAS
// ===================================
function getFilteredTasks() {
    switch (currentFilter) {
        case 'pending':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        case 'all':
        default:
            return tasks;
    }
}

// ===================================
// ACTUALIZAR ESTADÍSTICAS
// ===================================
function updateStats() {
    const total = tasks.length;
    const pending = tasks.filter(task => !task.completed).length;
    const completed = tasks.filter(task => task.completed).length;

    totalTasksEl.textContent = total;
    pendingTasksEl.textContent = pending;
    completedTasksEl.textContent = completed;
}

// ===================================
// ACTUALIZAR ESTADÍSTICAS CON ANIMACIÓN
// ===================================
function updateStatsWithAnimation() {
    const total = tasks.length;
    const pending = tasks.filter(task => !task.completed).length;
    const completed = tasks.filter(task => task.completed).length;

    animateNumber(totalTasksEl, parseInt(totalTasksEl.textContent) || 0, total);
    animateNumber(pendingTasksEl, parseInt(pendingTasksEl.textContent) || 0, pending);
    animateNumber(completedTasksEl, parseInt(completedTasksEl.textContent) || 0, completed);
}

// ===================================
// ANIMAR NÚMEROS
// ===================================
function animateNumber(element, start, end) {
    const duration = 500;
    const increment = (end - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            element.textContent = end;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// ===================================
// LOCAL STORAGE - GUARDAR
// ===================================
function saveTasksToLocalStorage() {
    try {
        localStorage.setItem('todoListTasks', JSON.stringify(tasks));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
}

// ===================================
// LOCAL STORAGE - CARGAR
// ===================================
function loadTasksFromLocalStorage() {
    try {
        const storedTasks = localStorage.getItem('todoListTasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    } catch (error) {
        console.error('Error al cargar desde localStorage:', error);
        tasks = [];
    }
}

// ===================================
// ESTILOS DE ANIMACIÓN ADICIONALES
// ===================================
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
    
    @keyframes successPop {
        0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
        }
        50% {
            transform: translate(-50%, -50%) scale(1.5);
        }
        100% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
    
    @keyframes fall {
        to {
            top: 100vh;
            transform: rotate(360deg);
        }
    }
`;
document.head.appendChild(style);
