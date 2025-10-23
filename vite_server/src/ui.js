import { escapeHtml, formatDate } from './utils.js';
import { state } from './data.js';

// --- 全体描画 ---
export function renderAll() {
    renderFolders();
    renderTasks();
    renderTimeline();
    updateStats();
}

// --- フォルダUI ---
export function renderFolders() {
    const container = document.getElementById('foldersContainer');
    const folderSelect = document.getElementById('folderSelect');
    const allCount = state.tasks.filter(t => !t.parentId).length;

    const folderCounts = {};
    state.folders.forEach(f => {
        folderCounts[f] = state.tasks.filter(t => !t.parentId && t.folder === f).length;
    });

    container.innerHTML = `
                <button class="folder-btn ${state.currentFolder === null ? 'active' : ''}" onclick="switchFolder(null)">
                    <span class="folder-name">すべて</span>
                    <span class="folder-count">${allCount}</span>
                </button>
                ${state.folders.map(folder => `
                    <button class="folder-btn ${state.currentFolder === folder ? 'active' : ''}" onclick="switchFolder('${folder}')">
                        <span class="folder-name">${folder}</span>
                        <span class="folder-count">${folderCounts[folder] || 0}</span>
                    </button>
                `).join('')}
                <button class="folder-btn add-folder" onclick="addFolder()" title="フォルダを追加">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            `;

    if (folderSelect) {
        folderSelect.innerHTML = state.folders.map(f =>
            `<option value="${f}">${f}</option>`
        ).join('');
    }
}

// --- タスクUI ---
export function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filteredTasks = state.tasks.filter(t => !t.parentId);

    if (state.currentFolder !== null) {
        filteredTasks = filteredTasks.filter(t => t.folder === state.currentFolder);
    }

    if (state.currentFilter === 'active') {
        filteredTasks = filteredTasks.filter(t => !t.completed);
    } else if (state.currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(t => t.completed);
    } else if (state.currentFilter === 'high') {
        filteredTasks = filteredTasks.filter(t => t.priority === 'high');
    } else if (state.currentFilter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filteredTasks = filteredTasks.filter(t => t.dueDate && t.dueDate <= today);
    }

    if (searchTerm) {
        filteredTasks = filteredTasks.filter(t =>
            t.text.toLowerCase().includes(searchTerm) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    filteredTasks.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    if (filteredTasks.length === 0) {
        container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">—</div>
                        <p>タスクが見つかりません</p>
                    </div>
                `;
        return;
    }

    container.innerHTML = filteredTasks.map(task => renderTask(task)).join('');
}

function renderTask(task) {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    const dueDateClass = isOverdue ? 'due-date overdue' : 'due-date';

    const hasSubtasks = task.subtasks.length > 0;
    const completedSubtasks = task.subtasks.filter(subId => {
        const st = state.tasks.find(t => t.id === subId);
        return st && st.completed;
    }).length;

    const subtasksHtml = hasSubtasks ? `
                <div class="subtasks-container">
                    ${task.subtasks.map(subId => {
        const subtask = state.tasks.find(t => t.id === subId);
        if (!subtask) return '';

        const subIsOverdue = subtask.dueDate && new Date(subtask.dueDate) < new Date() && !subtask.completed;
        const subDueDateClass = subIsOverdue ? 'due-date overdue' : 'due-date';

        return `
                            <div class="subtask ${subtask.completed ? 'completed' : ''} priority-${subtask.priority}">
                                <input type="checkbox" ${subtask.completed ? 'checked' : ''} 
                                       onchange="toggleTask(${subtask.id})" class="checkbox" />
                                <div class="subtask-content">
                                    <span class="subtask-text">${escapeHtml(subtask.text)}</span>
                                    ${subtask.tags.length > 0 || subtask.dueDate || subtask.priority !== 'medium' ? `
                                        <div class="subtask-meta">
                                            ${subtask.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                                            ${subtask.priority !== 'medium' ? `
                                                <span class="priority-badge priority-${subtask.priority}">
                                                    ${subtask.priority === 'high' ? '高' : subtask.priority === 'low' ? '低' : ''}
                                                </span>
                                            ` : ''}
                                            ${subtask.dueDate ? `<span class="subDueDateClass">${formatDate(subtask.dueDate)}</span>` : ''}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="subtask-actions">
                                    <button class="icon-btn" onclick="editTask(${subtask.id})" title="編集">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="icon-btn delete" onclick="deleteTask(${subtask.id})" title="削除">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            ` : '';

    const progressText = hasSubtasks ?
        `<span style="color: #666; font-size: 11px;">${completedSubtasks}/${task.subtasks.length}</span>` : '';

    return `
                <div class="task-wrapper ${hasSubtasks ? 'has-subtasks' : ''}">
                    <div class="task ${task.completed ? 'completed' : ''} priority-${task.priority}">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} 
                               onchange="toggleTask(${task.id})" class="checkbox" />
                        <div class="task-content">
                            <div class="task-text">${escapeHtml(task.text)}</div>
                            <div class="task-meta">
                                ${task.folder ? `<span class="tag" style="background: #2a2a2a;">📁 ${escapeHtml(task.folder)}</span>` : ''}
                                ${task.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                                <span class="priority-badge priority-${task.priority}">
                                    ${task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                                </span>
                                ${task.dueDate ? `<span class="${dueDateClass}">${formatDate(task.dueDate)}</span>` : ''}
                                ${progressText}
                                <span style="color: #444; font-size: 11px;">ID ${task.id}</span>
                            </div>
                        </div>
                        <div class="task-actions">
                            <button class="icon-btn" onclick="editTask(${task.id})" title="編集">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="icon-btn delete" onclick="deleteTask(${task.id})" title="削除">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    ${subtasksHtml}
                </div>
            `;
}

// --- 統計UI ---
export function updateStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const remaining = total - completed;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('remainingTasks').textContent = remaining;
    document.getElementById('accessCount').textContent = state.activityData.accessCount;

    updateInsights();
}

export function updateInsights() {
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = state.tasks.filter(t =>
        t.completed && t.completedAt && t.completedAt.startsWith(today)
    ).length;

    document.getElementById('todayCompleted').textContent = todayCompleted;
    document.getElementById('loginDays').textContent = state.activityData.loginDays;
    document.getElementById('consecutiveLoginDays').textContent = state.activityData.consecutiveLoginDays;

    const tagCount = {};
    state.tasks.forEach(t => {
        t.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
    });
    const mostUsed = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
    if (mostUsed) {
        document.getElementById('mostUsedTag').textContent = mostUsed[0];
    }
}

// --- タイムラインUI ---
let timelineExpanded = true;
export function toggleTimeline() {
    timelineExpanded = !timelineExpanded;
    const container = document.getElementById('timelineContainer');
    const chevron = document.getElementById('timelineChevron');

    if (timelineExpanded) {
        container.style.display = 'block';
        chevron.classList.remove('collapsed');
    } else {
        container.style.display = 'none';
        chevron.classList.add('collapsed');
    }
}

export function renderTimeline() {
    const container = document.getElementById('timelineContainer');

    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        weekDays.push(date);
    }

    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    const headerHtml = weekDays.map((date, i) => {
        const isToday = date.toDateString() === today.toDateString();
        return `
                    <div class="timeline-day ${isToday ? 'today' : ''}">
                        <div class="timeline-day-name">${dayNames[date.getDay()]}</div>
                        <div class="timeline-day-date">${date.getMonth() + 1}/${date.getDate()}</div>
                    </div>
                `;
    }).join('');

    const tasksByDay = weekDays.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        return state.tasks.filter(t => !t.parentId && t.dueDate === dateStr);
    });

    const contentHtml = tasksByDay.map((dayTasks, i) => {
        const isToday = weekDays[i].toDateString() === today.toDateString();

        if (dayTasks.length === 0) {
            return `<div class="timeline-column ${isToday ? 'today' : ''}"><div class="timeline-empty">—</div></div>`;
        }

        const tasksHtml = dayTasks.map(task => `
                    <div class="timeline-task ${task.completed ? 'completed' : ''} priority-${task.priority}" 
                         onclick="scrollToTask(${task.id})" 
                         title="${escapeHtml(task.text)}">
                        <div class="timeline-task-text">${escapeHtml(task.text.length > 30 ? task.text.substring(0, 30) + '...' : task.text)}</div>
                        <div class="timeline-task-meta">
                            ${task.folder ? `<span class="timeline-task-folder">${escapeHtml(task.folder)}</span>` : ''}
                            ${task.tags.slice(0, 2).map(tag => `<span>${escapeHtml(tag)}</span>`).join(' ')}
                        </div>
                    </div>
                `).join('');

        return `<div class="timeline-column ${isToday ? 'today' : ''}">${tasksHtml}</div>`;
    }).join('');

    container.innerHTML = `
                <div class="timeline-header">${headerHtml}</div>
                <div class="timeline-content">${contentHtml}</div>
            `;
}

export function scrollToTask(taskId) {
    const taskElements = document.querySelectorAll('.task-wrapper');
    for (let elem of taskElements) {
        const checkbox = elem.querySelector(`input[onchange*="${taskId}"]`);
        if (checkbox) {
            elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            elem.style.background = '#1a1a1a';
            setTimeout(() => {
                elem.style.background = '';
            }, 1000);
            break;
        }
    }
}

// --- アチーブメントUI ---
export function showAchievementToast(achievement) {
    const toast = document.getElementById('achievementToast');
    const message = document.getElementById('toastMessage');

    message.textContent = `'${achievement.name}' を達成しました！`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

export function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = Object.entries(state.achievements).map(([id, ach]) => {
        const unlocked = state.unlockedAchievements[id];
        const unlockedDate = unlocked ? new Date(unlocked.unlockedAt).toLocaleDateString() : null;

        return `
            <div class="achievement-card ${unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-info">
                    <div class="name">${ach.name}</div>
                </div>
                <div class="achievement-hover-details">
                    <p class="description">${ach.description}</p>
                    ${unlocked ? `<p class="unlocked-date">${unlockedDate}に達成</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}