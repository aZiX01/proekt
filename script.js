// Конфигурация
const WEATHER_API_KEY = 'c517910876c518e880f5f5bd3b541767'; // Получите бесплатный на openweathermap.org
const WEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Элементы DOM
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const taskCount = document.getElementById('taskCount');
const clearBtn = document.getElementById('clearCompleted');
const filterBtns = document.querySelectorAll('.filter-btn');
const weatherWidget = document.getElementById('weather');
const weatherTip = document.getElementById('weatherTip');

// Состояние приложения
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    updateTaskCount();
    getWeather();
    
    // Загрузка погоды каждые 30 минут
    setInterval(getWeather, 30 * 60 * 1000);
});

// Получение погоды
async function getWeather() {
    try {
        if (!navigator.geolocation) {
            weatherWidget.innerHTML = '<p>Геолокация не поддерживается</p>';
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            
            const response = await fetch(
                `${WEATHER_URL}?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric&lang=ru`
            );
            
            if (!response.ok) throw new Error('Ошибка получения погоды');
            
            const data = await response.json();
            displayWeather(data);
            generateWeatherTip(data);
        }, () => {
            // Если пользователь отказал в геолокации - погода по умолчанию (Москва)
            fetchDefaultWeather();
        });
    } catch (error) {
        console.error('Ошибка:', error);
        weatherWidget.innerHTML = '<p>Не удалось загрузить погоду</p>';
    }
}

async function fetchDefaultWeather() {
    try {
        const response = await fetch(
            `${WEATHER_URL}?q=Moscow&appid=${WEATHER_API_KEY}&units=metric&lang=ru`
        );
        const data = await response.json();
        displayWeather(data);
        generateWeatherTip(data);
    } catch (error) {
        weatherWidget.innerHTML = '<p>Погода временно недоступна</p>';
    }
}

function displayWeather(data) {
    const temp = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    
    weatherWidget.innerHTML = `
        <div class="weather-info">
            <h3><i class="fas fa-location-dot"></i> ${data.name}</h3>
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}" width="50">
                <div>
                    <p style="font-size: 24px; font-weight: bold;">${temp}°C</p>
                    <p style="text-transform: capitalize;">${description}</p>
                </div>
            </div>
        </div>
    `;
}

function generateWeatherTip(data) {
    const weatherId = data.weather[0].id;
    const temp = data.main.temp;
    let tip = '';
    
    if (weatherId >= 200 && weatherId < 300) {
        tip = '⛈️ На улице гроза! Лучше остаться дома.';
        addWeatherTask('Отменить планы на улицу из-за грозы');
    } else if (weatherId >= 300 && weatherId < 600) {
        tip = '🌧️ Идёт дождь, не забудьте зонтик!';
        addWeatherTask('Взять зонтик');
    } else if (weatherId >= 600 && weatherId < 700) {
        tip = '❄️ На улице снег. Тепло одевайтесь!';
        addWeatherTask('Надеть тёплую одежду');
    } else if (weatherId === 800) {
        tip = '☀️ Отличная солнечная погода! Можно планировать прогулку.';
        addWeatherTask('Сходить на прогулку');
    } else if (weatherId > 800) {
        tip = '☁️ Сегодня облачно. Хороший день для работы дома.';
    }
    
    if (temp > 25) {
        tip += ' 🥵 Жарко, пейте больше воды!';
        addWeatherTask('Купить бутылку воды');
    } else if (temp < 0) {
        tip += ' 🥶 Мороз! Одевайтесь теплее.';
    }
    
    weatherTip.innerHTML = `<p><i class="fas fa-lightbulb"></i> <strong>Совет:</strong> ${tip}</p>`;
}

function addWeatherTask(taskText) {
    // Проверяем, нет ли уже такой задачи
    const exists = todos.some(todo => todo.text.toLowerCase().includes(taskText.toLowerCase()));
    if (!exists) {
        addTodo(taskText);
    }
}

// Работа с задачами
function addTodo(text) {
    if (text.trim() === '') return;
    
    const todo = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.push(todo);
    saveTodos();
    renderTodos();
    todoInput.value = '';
    updateTaskCount();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateTaskCount();
}

function toggleTodo(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
    updateTaskCount();
}

// Рендеринг
function renderTodos() {
    todoList.innerHTML = '';
    
    const filteredTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });
    
    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
            <span>${todo.text}</span>
            <button class="delete-btn" title="Удалить">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        li.querySelector('.todo-checkbox').addEventListener('click', () => toggleTodo(todo.id));
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
        
        todoList.appendChild(li);
    });
}

// Вспомогательные функции
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadTodos() {
    renderTodos();
}

function updateTaskCount() {
    const activeCount = todos.filter(todo => !todo.completed).length;
    taskCount.textContent = activeCount;
}

// Обработчики событий
addBtn.addEventListener('click', () => {
    addTodo(todoInput.value);
});

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo(todoInput.value);
    }
});

clearBtn.addEventListener('click', () => {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
    updateTaskCount();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTodos();
    });
});