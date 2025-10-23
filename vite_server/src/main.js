// データストア
let tasks = [];
let folders = ['個人', '仕事', 'プロジェクト'];
let currentFilter = 'all';
let currentFolder = null; // null = すべてのフォルダ
let taskIdCounter = 1;
let activityData = {
    accessCount: 0,
    loginDays: 1,
    consecutiveLoginDays: 1,
    lastAccessDate: null,
    lastCompletedDate: null, // 新規追加
    consecutiveCompletedDays: 0, // 新規追加
    easterEggClickCount: 0, // 新規追加
    searchCount: 0 // 新規追加
};
let achievements = {};
let unlockedAchievements = {};

// 初期化
function init() {
    defineAchievements();
    loadFromLocalStorage();
    trackAccess();
    renderFolders();
    renderTasks();
    renderTimeline();
    updateStats();
    renderAchievements();
    checkAchievements();
    setupKeyboardShortcuts();
    setupEasterEgg(); // 新規追加
}

// アチーブメント定義
function defineAchievements() {
    achievements = {
        access_1: { name: '最初の訪問', description: '初めてアプリを使いました。', condition: { type: 'access', value: 1 }, icon: '👋' },
        access_10: { name: '常連さん', description: '10回目の訪問です！', condition: { type: 'access', value: 10 }, icon: '🚶‍♂️' },
        access_50: { name: 'ヘビーユーザー', description: '50回も訪問してくれました！', condition: { type: 'access', value: 50 }, icon: '🏃‍♂️' },
        access_100: { name: '殿堂入り', description: '100回訪問！もうあなたなしではいられません。', condition: { type: 'access', value: 100 }, icon: '👑' },

        completed_1: { name: 'はじめの一歩', description: '最初のタスクを完了しました。', condition: { type: 'completed', value: 1 }, icon: '✅' },
        completed_10: { name: 'タスクキラー', description: '10個のタスクを完了！', condition: { type: 'completed', value: 10 }, icon: '💥' },
        completed_50: { name: 'タスクマスター', description: '50個のタスクを完了！お見事！', condition: { type: 'completed', value: 50 }, icon: '🎯' },
        completed_100: { name: '生産性の鬼', description: '100個のタスクを完了！素晴らしい！', condition: { type: 'completed', value: 100 }, icon: '👹' },

        // --- 新しいアチーブメント ---
        // 時間・期限関連
        early_bird: { name: '早起き鳥', description: '午前6時までにタスクを完了する。', condition: { type: 'time_of_day', hour: 6, before: true }, icon: '🐦' },
        night_owl: { name: '夜更かしフクロウ', description: '深夜0時以降にタスクを完了する。', condition: { type: 'time_of_day', hour: 0, after: true }, icon: '🦉' },
        on_time_1: { name: '期限厳守 (初級)', description: '期限日までにタスクを1個完了する。', condition: { type: 'on_time_completed', value: 1 }, icon: '⏱️' },
        on_time_10: { name: '期限厳守 (中級)', description: '期限日までにタスクを10個完了する。', condition: { type: 'on_time_completed', value: 10 }, icon: '⏰' },
        future_planner: { name: '未来の自分へ', description: '1ヶ月以上先の期限を設定したタスクを完了する。', condition: { type: 'future_due', days: 30 }, icon: '🔮' },
        past_due_hero_1: { name: '期限切れヒーロー (初級)', description: '期限切れのタスクを1個完了する。', condition: { type: 'past_due_completed', value: 1 }, icon: '🦸' },
        past_due_hero_5: { name: '期限切れヒーロー (中級)', description: '期限切れのタスクを5個完了する。', condition: { type: 'past_due_completed', value: 5 }, icon: '🦹' },

        // 優先度関連
        high_priority_master_1: { name: '高優先度マスター (初級)', description: '高優先度タスクを1個完了する。', condition: { type: 'priority_completed', priority: 'high', value: 1 }, icon: '🔥' },
        high_priority_master_10: { name: '高優先度マスター (中級)', description: '高優先度タスクを10個完了する。', condition: { type: 'priority_completed', priority: 'high', value: 10 }, icon: '🚀' },
        balanced_1: { name: 'バランスの取れた人', description: '高・中・低の優先度タスクをそれぞれ1個ずつ完了する。', condition: { type: 'balanced_priority', value: 1 }, icon: '⚖️' },

        // タグ・フォルダ関連
        tag_collector_3: { name: 'タグコレクター (初級)', description: '3種類のタグを使用する。', condition: { type: 'unique_tags', value: 3 }, icon: '🏷️' },
        tag_collector_5: { name: 'タグコレクター (中級)', description: '5種類のタグを使用する。', condition: { type: 'unique_tags', value: 5 }, icon: '🔖' },
        folder_organizer_3: { name: 'フォルダ整理術 (初級)', description: '3個のフォルダを作成する。', condition: { type: 'unique_folders', value: 3 }, icon: '🗂️' },
        folder_organizer_5: { name: 'フォルダ整理術 (中級)', description: '5個のフォルダを作成する。', condition: { type: 'unique_folders', value: 5 }, icon: '📂' },

        // サブタスク関連
        parent_task_completed_1: { name: '親タスク完了 (初級)', description: 'サブタスクを持つ親タスクを1個完了する。', condition: { type: 'parent_completed', value: 1 }, icon: '🌳' },
        parent_task_completed_5: { name: '親タスク完了 (中級)', description: 'サブタスクを持つ親タスクを5個完了する。', condition: { type: 'parent_completed', value: 5 }, icon: '🌲' },
        subtask_master_1: { name: 'サブタスクマスター (初級)', description: 'サブタスクを1個完了する。', condition: { type: 'subtask_completed', value: 1 }, icon: '🌿' },
        subtask_master_10: { name: 'サブタスクマスター (中級)', description: 'サブタスクを10個完了する。', condition: { type: 'subtask_completed', value: 10 }, icon: '🌱' },
        perfectionist: { name: '完璧主義者', description: '全てのサブタスクを完了してから親タスクを完了する。', condition: { type: 'perfectionist' }, icon: '💯' },

        // 連続記録関連
        consecutive_login_3: { name: '連続ログイン (3日)', description: '3日間連続でアプリにアクセスする。', condition: { type: 'consecutive_login', value: 3 }, icon: '🗓️' },
        consecutive_login_7: { name: '連続ログイン (7日)', description: '7日間連続でアプリにアクセスする。', condition: { type: 'consecutive_login', value: 7 }, icon: '📅' },
        consecutive_completed_3: { name: '連続タスク完了 (3日)', description: '3日間連続でタスクを完了する。', condition: { type: 'consecutive_completed', value: 3 }, icon: ' streak' },
        consecutive_completed_7: { name: '連続タスク完了 (7日)', description: '7日間連続でタスクを完了する。', condition: { type: 'consecutive_completed', value: 7 }, icon: '🔥' },

        // ユニーク・隠しアチーブメント
        easter_egg_click: { name: '隠しコマンド', description: 'アプリのタイトルを10回クリックする。', condition: { type: 'easter_egg_click', value: 10 }, icon: '🥚' },
        search_master_1: { name: '検索の達人 (初級)', description: '検索機能を1回使用する。', condition: { type: 'search_count', value: 1 }, icon: '🔍' },
        search_master_10: { name: '検索の達人 (中級)', description: '検索機能を10回使用する。', condition: { type: 'search_count', value: 10 }, icon: '🔎' },
    };
}

// アクセス追跡
function trackAccess() {
    const today = new Date().toISOString().split('T')[0];
    activityData.accessCount++;

    if (activityData.lastAccessDate) {
        const lastAccess = new Date(activityData.lastAccessDate);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastAccess.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
            activityData.consecutiveLoginDays++;
        } else if (lastAccess.toISOString().split('T')[0] !== today) {
            activityData.consecutiveLoginDays = 1;
        }
    } else {
        activityData.consecutiveLoginDays = 1;
    }
    activityData.lastAccessDate = today;
    saveToLocalStorage();
}

// タスク追加
function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();

    if (!text) return;

    const tagInput = document.getElementById('tagInput').value;
    const priority = document.getElementById('prioritySelect').value;
    const dueDate = document.getElementById('dueDateInput').value;
    const parentId = document.getElementById('parentTaskInput').value;

    let validParentId = null;
    if (parentId) {
        const parsedParentId = parseInt(parentId);
        const parent = tasks.find(t => t.id === parsedParentId);

        if (!parent) {
            alert(`エラー: ID ${parsedParentId} のタスクが見つかりません`);
            return;
        }

        if (parent.parentId !== null) {
            if (!confirm(`警告: タスク「${parent.text}」は既にサブタスクです。
このタスクを親にすると表示されなくなりますが続けますか？`)) {
                return;
            }
        }

        validParentId = parsedParentId;
    }

    const task = {
        id: taskIdCounter++,
        text: text,
        completed: false,
        priority: priority,
        tags: tagInput ? tagInput.split(',').map(t => t.trim()).filter(t => t) : [],
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        parentId: validParentId,
        subtasks: [],
        folder: currentFolder || document.getElementById('folderSelect').value
    };

    if (task.parentId) {
        const parent = tasks.find(t => t.id === task.parentId);
        if (parent) {
            parent.subtasks.push(task.id);
        }
    }

    tasks.push(task);

    input.value = '';
    document.getElementById('tagInput').value = '';
    document.getElementById('prioritySelect').value = 'medium';
    document.getElementById('dueDateInput').value = '';
    document.getElementById('parentTaskInput').value = '';

    saveToLocalStorage();
    cleanupOrphanedTasks();
    renderAll();
    checkAchievements(); // タスク追加時にもチェック

    input.focus();
}

// タスク完了トグル
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const wasCompleted = task.completed;
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        if (task.completed && task.subtasks.length > 0) {
            task.subtasks.forEach(subId => {
                const subtask = tasks.find(t => t.id === subId);
                if (subtask && !subtask.completed) {
                    subtask.completed = true;
                    subtask.completedAt = new Date().toISOString();
                }
            });
        }

        // 連続タスク完了日数の更新
        if (task.completed && !wasCompleted) { // 新しく完了した場合のみ
            const today = new Date().toISOString().split('T')[0];
            if (activityData.lastCompletedDate) {
                const lastCompleted = new Date(activityData.lastCompletedDate);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastCompleted.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
                    activityData.consecutiveCompletedDays++;
                } else if (lastCompleted.toISOString().split('T')[0] !== today) {
                    activityData.consecutiveCompletedDays = 1;
                }
            } else {
                activityData.consecutiveCompletedDays = 1;
            }
            activityData.lastCompletedDate = today;
        } else if (!task.completed && wasCompleted) { // 完了が解除された場合
            // 連続記録はリセットしないが、lastCompletedDateは再計算が必要になる可能性
            // 今回はシンプルに、完了解除では連続記録をリセットしない
        }

        saveToLocalStorage();
        renderAll();
        checkAchievements(); // タスク完了時にもチェック
    }
}

// タスク削除
function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    let confirmMsg = 'このタスクを削除しますか？';
    if (task.subtasks.length > 0) {
        confirmMsg = `このタスクには${task.subtasks.length}個のサブタスクがあります。
サブタスクも一緒に削除されますが、よろしいですか？`;
    }

    if (confirm(confirmMsg)) {
        const toDelete = new Set([id]);
        const collectSubtasks = (taskId) => {
            const t = tasks.find(task => task.id === taskId);
            if (t && t.subtasks.length > 0) {
                t.subtasks.forEach(subId => {
                    toDelete.add(subId);
                    collectSubtasks(subId);
                });
            }
        };
        collectSubtasks(id);

        tasks = tasks.filter(t => !toDelete.has(t.id));

        tasks.forEach(t => {
            t.subtasks = t.subtasks.filter(subId => !toDelete.has(subId));
        });

        saveToLocalStorage();
        cleanupOrphanedTasks();
        renderAll();
        checkAchievements(); // タスク削除時にもチェック
    }
}

// タスク編集
function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newText = prompt('タスクを編集:', task.text);
    if (newText !== null && newText.trim()) {
        task.text = newText.trim();
        saveToLocalStorage();
        renderAll();
    }
}

// フォルダ切り替え
function switchFolder(folder) {
    currentFolder = folder;
    renderFolders();
    renderTasks();
    updateStats();
}

// フォルダ表示
function renderFolders() {
    const container = document.getElementById('foldersContainer');
    const folderSelect = document.getElementById('folderSelect');
    const allCount = tasks.filter(t => !t.parentId).length;

    const folderCounts = {};
    folders.forEach(f => {
        folderCounts[f] = tasks.filter(t => !t.parentId && t.folder === f).length;
    });

    container.innerHTML = `
                <button class="folder-btn ${currentFolder === null ? 'active' : ''}" onclick="switchFolder(null)">
                    <span class="folder-name">すべて</span>
                    <span class="folder-count">${allCount}</span>
                </button>
                ${folders.map(folder => `
                    <button class="folder-btn ${currentFolder === folder ? 'active' : ''}" onclick="switchFolder('${folder}')">
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
        folderSelect.innerHTML = folders.map(f =>
            `<option value="${f}">${f}</option>`
        ).join('');
    }
}

// フォルダ追加
function addFolder() {
    const name = prompt('新しいフォルダ名:');
    if (name && name.trim() && !folders.includes(name.trim())) {
        folders.push(name.trim());
        saveToLocalStorage();
        renderFolders();
        checkAchievements(); // フォルダ追加時にもチェック
    } else if (folders.includes(name.trim())) {
        alert('そのフォルダは既に存在します');
    }
}
function filterTasks(filter) {
    currentFilter = filter;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderTasks();
}

// 検索
function searchTasks() {
    activityData.searchCount++; // 検索回数をカウント
    saveToLocalStorage();
    renderTasks();
    checkAchievements(); // 検索時にもチェック
}

// タスク表示
function renderTasks() {
    const container = document.getElementById('tasksContainer');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    let filteredTasks = tasks.filter(t => !t.parentId);

    if (currentFolder !== null) {
        filteredTasks = filteredTasks.filter(t => t.folder === currentFolder);
    }

    if (currentFilter === 'active') {
        filteredTasks = filteredTasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = filteredTasks.filter(t => t.completed);
    } else if (currentFilter === 'high') {
        filteredTasks = filteredTasks.filter(t => t.priority === 'high');
    } else if (currentFilter === 'today') {
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

// 単一タスクHTML生成
function renderTask(task) {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    const dueDateClass = isOverdue ? 'due-date overdue' : 'due-date';

    const hasSubtasks = task.subtasks.length > 0;
    const completedSubtasks = task.subtasks.filter(subId => {
        const st = tasks.find(t => t.id === subId);
        return st && st.completed;
    }).length;

    const subtasksHtml = hasSubtasks ? `
                <div class="subtasks-container">
                    ${task.subtasks.map(subId => {
        const subtask = tasks.find(t => t.id === subId);
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

// --- アチーブメント関連 ---
function checkAchievements() {
    const completedTasks = tasks.filter(t => t.completed);
    const completedCount = completedTasks.length;
    const accessCount = activityData.accessCount;
    const searchCount = activityData.searchCount;

    // 優先度別の完了タスク数
    const highPriorityCompleted = completedTasks.filter(t => t.priority === 'high').length;
    const mediumPriorityCompleted = completedTasks.filter(t => t.priority === 'medium').length;
    const lowPriorityCompleted = completedTasks.filter(t => t.priority === 'low').length;

    // 使用されているユニークなタグとフォルダ
    const uniqueTags = new Set();
    tasks.forEach(t => t.tags.forEach(tag => uniqueTags.add(tag)));
    const uniqueFolders = new Set(folders);

    // サブタスク関連
    const parentTasksWithSubtasksCompleted = completedTasks.filter(t => t.subtasks.length > 0).length;
    const subtasksCompletedCount = completedTasks.filter(t => t.parentId !== null).length;

    for (const id in achievements) {
        if (unlockedAchievements[id]) continue;

        const ach = achievements[id];
        let conditionMet = false;

        switch (ach.condition.type) {
            case 'access':
                if (accessCount >= ach.condition.value) conditionMet = true;
                break;
            case 'completed':
                if (completedCount >= ach.condition.value) conditionMet = true;
                break;
            case 'time_of_day':
                conditionMet = completedTasks.some(t => {
                    if (!t.completedAt) return false;
                    const completedHour = new Date(t.completedAt).getHours();
                    if (ach.condition.before && completedHour < ach.condition.hour) return true;
                    if (ach.condition.after && completedHour >= ach.condition.hour) return true;
                    return false;
                });
                break;
            case 'on_time_completed':
                const onTimeCompletedCount = completedTasks.filter(t => {
                    if (!t.dueDate || !t.completedAt) return false;
                    const dueDate = new Date(t.dueDate);
                    const completedAt = new Date(t.completedAt);
                    return completedAt.toISOString().split('T')[0] <= dueDate.toISOString().split('T')[0];
                }).length;
                if (onTimeCompletedCount >= ach.condition.value) conditionMet = true;
                break;
            case 'future_due':
                conditionMet = completedTasks.some(t => {
                    if (!t.dueDate || !t.createdAt) return false;
                    const dueDate = new Date(t.dueDate);
                    const createdAt = new Date(t.createdAt);
                    const diffTime = Math.abs(dueDate.getTime() - createdAt.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays >= ach.condition.days;
                });
                break;
            case 'past_due_completed':
                const pastDueCompletedCount = completedTasks.filter(t => {
                    if (!t.dueDate || !t.completedAt) return false;
                    const dueDate = new Date(t.dueDate);
                    const completedAt = new Date(t.completedAt);
                    return completedAt.toISOString().split('T')[0] > dueDate.toISOString().split('T')[0];
                }).length;
                if (pastDueCompletedCount >= ach.condition.value) conditionMet = true;
                break;
            case 'priority_completed':
                const targetPriorityCompleted = completedTasks.filter(t => t.priority === ach.condition.priority).length;
                if (targetPriorityCompleted >= ach.condition.value) conditionMet = true;
                break;
            case 'balanced_priority':
                if (highPriorityCompleted >= ach.condition.value &&
                    mediumPriorityCompleted >= ach.condition.value &&
                    lowPriorityCompleted >= ach.condition.value) {
                    conditionMet = true;
                }
                break;
            case 'unique_tags':
                if (uniqueTags.size >= ach.condition.value) conditionMet = true;
                break;
            case 'unique_folders':
                if (uniqueFolders.size >= ach.condition.value) conditionMet = true;
                break;
            case 'parent_completed':
                if (parentTasksWithSubtasksCompleted >= ach.condition.value) conditionMet = true;
                break;
            case 'subtask_completed':
                if (subtasksCompletedCount >= ach.condition.value) conditionMet = true;
                break;
            case 'perfectionist':
                conditionMet = completedTasks.some(t => {
                    if (t.subtasks.length === 0) return false; // サブタスクがない親タスクは対象外
                    // 親タスクが完了しており、かつ全てのサブタスクも完了しているか
                    return t.completed && t.subtasks.every(subId => {
                        const subtask = tasks.find(st => st.id === subId);
                        return subtask && subtask.completed;
                    });
                });
                break;
            case 'consecutive_login':
                if (activityData.consecutiveLoginDays >= ach.condition.value) conditionMet = true;
                break;
            case 'consecutive_completed':
                if (activityData.consecutiveCompletedDays >= ach.condition.value) conditionMet = true;
                break;
            case 'easter_egg_click':
                if (activityData.easterEggClickCount >= ach.condition.value) conditionMet = true;
                break;
            case 'search_count':
                if (activityData.searchCount >= ach.condition.value) conditionMet = true;
                break;
        }

        if (conditionMet) {
            unlockAchievement(id);
        }
    }
}

function unlockAchievement(id) {
    if (unlockedAchievements[id]) return;

    const ach = achievements[id];
    showAchievementToast(ach);

    unlockedAchievements[id] = {
        unlockedAt: new Date().toISOString()
    };
    saveToLocalStorage();
    renderAchievements();
}

function showAchievementToast(achievement) {
    const toast = document.getElementById('achievementToast');
    const message = document.getElementById('toastMessage');

    message.textContent = `'${achievement.name}' を達成しました！`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = Object.entries(achievements).map(([id, ach]) => {
        const unlocked = unlockedAchievements[id];
        const unlockedDate = unlocked ? new Date(unlocked.unlockedAt).toLocaleDateString() : null;

        return `
                    <div class="achievement-card ${unlocked ? 'unlocked' : ''}">
                        <div class="achievement-icon">${ach.icon}</div>
                        <div class="achievement-info">
                            <div class="name">${ach.name}</div>
                            <div class="description">${ach.description}</div>
                            ${unlocked ? `<div class="unlocked-date">${unlockedDate}に達成</div>` : ''}
                        </div>
                    </div>
                `;
    }).join('');
}

// --- 統計・描画関連 ---
function renderAll() {
    renderFolders();
    renderTasks();
    renderTimeline();
    updateStats();
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const remaining = total - completed;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('remainingTasks').textContent = remaining;
    document.getElementById('accessCount').textContent = activityData.accessCount;

    updateInsights();
}

let timelineExpanded = true;
function toggleTimeline() {
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

function renderTimeline() {
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
        return tasks.filter(t => !t.parentId && t.dueDate === dateStr);
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

function scrollToTask(taskId) {
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

function updateInsights() {
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = tasks.filter(t =>
        t.completed && t.completedAt && t.completedAt.startsWith(today)
    ).length;

    document.getElementById('todayCompleted').textContent = todayCompleted;
    document.getElementById('loginDays').textContent = activityData.loginDays;
    document.getElementById('consecutiveLoginDays').textContent = activityData.consecutiveLoginDays;

    const tagCount = {};
    tasks.forEach(t => {
        t.tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
    });
    const mostUsed = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0];
    if (mostUsed) {
        document.getElementById('mostUsedTag').textContent = mostUsed[0];
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            addTask();
        }
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
}

// イースターエッグのセットアップ
function setupEasterEgg() {
    const appTitle = document.getElementById('appTitle');
    if (appTitle) {
        appTitle.addEventListener('click', () => {
            activityData.easterEggClickCount++;
            saveToLocalStorage();
            checkAchievements();
        });
    }
}

// --- データ永続化 ---
function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('folders', JSON.stringify(folders));
    localStorage.setItem('taskIdCounter', taskIdCounter);
    localStorage.setItem('activityData', JSON.stringify(activityData));
    localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('tasks');
    if (saved) {
        tasks = JSON.parse(saved);
        tasks.forEach(task => {
            if (!task.folder) task.folder = '個人';
        });
        cleanupOrphanedTasks();
    }
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) folders = JSON.parse(savedFolders);

    const savedCounter = localStorage.getItem('taskIdCounter');
    if (savedCounter) taskIdCounter = parseInt(savedCounter);

    const savedActivity = localStorage.getItem('activityData');
    if (savedActivity) activityData = JSON.parse(savedActivity);

    const savedUnlocked = localStorage.getItem('unlockedAchievements');
    if (savedUnlocked) unlockedAchievements = JSON.parse(savedUnlocked);
}

function cleanupOrphanedTasks() {
    const taskIds = new Set(tasks.map(t => t.id));
    let cleaned = false;

    tasks.forEach(task => {
        if (task.parentId !== null && !taskIds.has(task.parentId)) {
            console.warn(`孤立タスク検出: ID ${task.id} の親 ${task.parentId} が存在しません。親参照を削除します。`);
            task.parentId = null;
            cleaned = true;
        }

        const validSubtasks = task.subtasks.filter(subId => taskIds.has(subId));
        if (validSubtasks.length !== task.subtasks.length) {
            console.warn(`タスク ID ${task.id} から存在しないサブタスク参照を削除しました`);
            task.subtasks = validSubtasks;
            cleaned = true;
        }
    });

    if (cleaned) {
        saveToLocalStorage();
    }
    return cleaned;
}

function checkDataIntegrity() {
    const issues = [];
    const taskIds = new Set(tasks.map(t => t.id));

    tasks.forEach(task => {
        if (task.parentId !== null && !taskIds.has(task.parentId)) {
            issues.push(`タスク ${task.id}: 親 ${task.parentId} が存在しません`);
        }
        task.subtasks.forEach(subId => {
            if (!taskIds.has(subId)) {
                issues.push(`タスク ${task.id}: サブタスク ${subId} が存在しません`);
            }
        });
    });

    if (issues.length > 0) {
        console.error('データ整合性エラー:', issues);
        return false;
    }

    console.log('データ整合性: OK');
    return true;
}

// --- ユーティリティ ---
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return '今日';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return '明日';

    return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 初期化実行
init();

