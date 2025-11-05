// IIFE to avoid global scope pollution
(function() {
    'use strict';

    // Task Class Definition
    class Task {
        constructor(title, description = '', dueDate = '', priority = 'low') {
            this.id = Date.now().toString();
            this.title = title;
            this.description = description;
            this.dueDate = dueDate;
            this.priority = priority;
            this.completed = false;
            this.createdAt = new Date().toISOString();
        }
    }

    // TodoApp Class Definition
    class TodoApp {
        constructor() {
            this.tasks = [];
            this.setupEventListeners();
            this.loadFromLocalStorage();
            this.setupThemeToggle();
            this.renderTasks();
        }

        // Event Listeners Setup
        setupEventListeners() {
            // Form submission
            document.getElementById('taskForm').addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTask();
            });

            // Filter and sort
            document.getElementById('filterTasks').addEventListener('change', () => this.renderTasks());
            document.getElementById('sortTasks').addEventListener('change', () => this.renderTasks());
            document.getElementById('searchTasks').addEventListener('input', () => this.renderTasks());

            // Export and import
            document.getElementById('exportTasks').addEventListener('click', () => this.exportTasks());
            document.getElementById('importTasks').addEventListener('click', () => this.importTasks());

            // Edit task modal
            document.getElementById('saveEditTask').addEventListener('click', () => this.saveEditTask());
        }

        // Theme Toggle Setup
        setupThemeToggle() {
            const themeToggle = document.querySelector('.theme-toggle');
            const lightIcon = document.querySelector('.light-icon');
            const darkIcon = document.querySelector('.dark-icon');

            // Load saved theme
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-bs-theme', savedTheme);
            this.updateThemeIcons(savedTheme === 'dark');

            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
                const newTheme = isDark ? 'light' : 'dark';
                document.documentElement.setAttribute('data-bs-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                this.updateThemeIcons(!isDark);
            });
        }

        updateThemeIcons(isDark) {
            const lightIcon = document.querySelector('.light-icon');
            const darkIcon = document.querySelector('.dark-icon');
            lightIcon.classList.toggle('d-none', isDark);
            darkIcon.classList.toggle('d-none', !isDark);
        }

        // Task Management Methods
        addTask() {
            const titleInput = document.getElementById('taskTitle');
            const descInput = document.getElementById('taskDescription');
            const dateInput = document.getElementById('taskDueDate');
            const priorityInput = document.getElementById('taskPriority');

            const task = new Task(
                titleInput.value,
                descInput.value,
                dateInput.value,
                priorityInput.value
            );

            this.tasks.push(task);
            this.saveToLocalStorage();
            this.renderTasks();

            // Reset form
            document.getElementById('taskForm').reset();
        }

        deleteTask(taskId) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveToLocalStorage();
            this.renderTasks();
        }

        toggleTaskComplete(taskId) {
            const task = this.tasks.find(task => task.id === taskId);
            if (task) {
                task.completed = !task.completed;
                this.saveToLocalStorage();
                this.renderTasks();
            }
        }

        openEditModal(taskId) {
            const task = this.tasks.find(task => task.id === taskId);
            if (!task) return;

            // Populate modal fields
            document.getElementById('editTaskTitle').value = task.title;
            document.getElementById('editTaskDescription').value = task.description;
            document.getElementById('editTaskDueDate').value = task.dueDate;
            document.getElementById('editTaskPriority').value = task.priority;

            // Store task ID for saving
            document.getElementById('editTaskForm').dataset.taskId = taskId;

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
            modal.show();
        }

        saveEditTask() {
            const taskId = document.getElementById('editTaskForm').dataset.taskId;
            const task = this.tasks.find(task => task.id === taskId);
            if (!task) return;

            task.title = document.getElementById('editTaskTitle').value;
            task.description = document.getElementById('editTaskDescription').value;
            task.dueDate = document.getElementById('editTaskDueDate').value;
            task.priority = document.getElementById('editTaskPriority').value;

            this.saveToLocalStorage();
            this.renderTasks();

            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
            modal.hide();
        }

        // Filter, Sort, and Search Methods
        filterTasks() {
            const filterValue = document.getElementById('filterTasks').value;
            let filteredTasks = [...this.tasks];

            // Apply filter
            switch (filterValue) {
                case 'active':
                    filteredTasks = filteredTasks.filter(task => !task.completed);
                    break;
                case 'completed':
                    filteredTasks = filteredTasks.filter(task => task.completed);
                    break;
            }

            // Apply search
            const searchQuery = document.getElementById('searchTasks').value.toLowerCase();
            if (searchQuery) {
                filteredTasks = filteredTasks.filter(task =>
                    task.title.toLowerCase().includes(searchQuery) ||
                    task.description.toLowerCase().includes(searchQuery)
                );
            }

            return filteredTasks;
        }

        sortTasks(tasks) {
            const sortValue = document.getElementById('sortTasks').value;
            return [...tasks].sort((a, b) => {
                switch (sortValue) {
                    case 'dueDate':
                        return new Date(a.dueDate) - new Date(b.dueDate);
                    case 'priority':
                        const priorityOrder = { high: 3, medium: 2, low: 1 };
                        return priorityOrder[b.priority] - priorityOrder[a.priority];
                    default: // 'created'
                        return new Date(a.createdAt) - new Date(b.createdAt);
                }
            });
        }

        // Render Methods
        renderTasks() {
            const tasksList = document.getElementById('tasksList');
            const filteredTasks = this.filterTasks();
            const sortedTasks = this.sortTasks(filteredTasks);

            tasksList.innerHTML = '';

            sortedTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                tasksList.appendChild(taskElement);
            });
        }

        createTaskElement(task) {
            const template = document.getElementById('taskTemplate');
            const taskElement = template.content.cloneNode(true);
            const taskCard = taskElement.querySelector('.task-item');

            // Add completed class if task is completed
            if (task.completed) {
                taskCard.classList.add('task-completed');
            }

            // Set task content
            taskCard.querySelector('.task-title').textContent = task.title;
            taskCard.querySelector('.task-description').textContent = task.description || 'No description';
            taskCard.querySelector('.task-date').textContent = task.dueDate ? 
                `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date';

            // Set priority badge
            const badge = taskCard.querySelector('.badge');
            badge.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            badge.dataset.priority = task.priority;

            // Setup action buttons
            taskCard.querySelector('.edit-task').addEventListener('click', () => this.openEditModal(task.id));
            taskCard.querySelector('.delete-task').addEventListener('click', () => this.deleteTask(task.id));
            taskCard.querySelector('.complete-task').addEventListener('click', () => this.toggleTaskComplete(task.id));

            return taskElement;
        }

        // Storage Methods
        saveToLocalStorage() {
            localStorage.setItem('tasks', JSON.stringify(this.tasks));
        }

        loadFromLocalStorage() {
            const savedTasks = localStorage.getItem('tasks');
            this.tasks = savedTasks ? JSON.parse(savedTasks) : [];
        }

        // Import/Export Methods
        exportTasks() {
            const dataStr = JSON.stringify(this.tasks, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportLink = document.createElement('a');
            exportLink.setAttribute('href', dataUri);
            exportLink.setAttribute('download', 'tasks.json');
            exportLink.click();
        }

        importTasks() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';

            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();

                reader.onload = event => {
                    try {
                        const tasks = JSON.parse(event.target.result);
                        this.tasks = tasks;
                        this.saveToLocalStorage();
                        this.renderTasks();
                    } catch (error) {
                        alert('Invalid JSON file');
                    }
                };

                reader.readAsText(file);
            };

            input.click();
        }
    }

    // Initialize the app
    document.addEventListener('DOMContentLoaded', () => {
        new TodoApp();
    });
})();