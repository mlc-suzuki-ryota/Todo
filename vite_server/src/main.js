import { formatDate, escapeHtml } from './utils.js';
import { state, setInitialState, loadFromLocalStorage, cleanupOrphanedTasks, saveToLocalStorage, setCurrentFolder, setCurrentFilter } from './data.js';
import { renderAll, renderFolders, renderTasks, updateStats, toggleTimeline, scrollToTask, showAchievementToast, renderAchievements } from './ui.js';

// 初期化
function init() {
    const initialState = loadFromLocalStorage();
    setInitialState(initialState);
    cleanupOrphanedTasks();

    defineAchievements();
    trackAccess();
    renderAll();
    renderAchievements();
    checkAchievements();
    setupKeyboardShortcuts();
    setupEasterEgg();
}

// アチーブメント定義
function defineAchievements() {
    state.achievements = {
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
    state.activityData.accessCount++;

    if (state.activityData.lastAccessDate) {
        const lastAccess = new Date(state.activityData.lastAccessDate);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastAccess.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
            state.activityData.consecutiveLoginDays++;
        } else if (lastAccess.toISOString().split('T')[0] !== today) {
            state.activityData.consecutiveLoginDays = 1;
        }
    } else {
        state.activityData.consecutiveLoginDays = 1;
    }
    state.activityData.lastAccessDate = today;
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
        const parent = state.tasks.find(t => t.id === parsedParentId);

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
        id: state.taskIdCounter++,
        text: text,
        completed: false,
        priority: priority,
        tags: tagInput ? tagInput.split(',').map(t => t.trim()).filter(t => t) : [],
        dueDate: dueDate || null,
        createdAt: new Date().toISOString(),
        completedAt: null,
        parentId: validParentId,
        subtasks: [],
        folder: state.currentFolder || document.getElementById('folderSelect').value
    };

    if (task.parentId) {
        const parent = state.tasks.find(t => t.id === task.parentId);
        if (parent) {
            parent.subtasks.push(task.id);
        }
    }

    state.tasks.push(task);

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
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        const wasCompleted = task.completed;
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        if (task.completed && task.subtasks.length > 0) {
            task.subtasks.forEach(subId => {
                const subtask = state.tasks.find(t => t.id === subId);
                if (subtask && !subtask.completed) {
                    subtask.completed = true;
                    subtask.completedAt = new Date().toISOString();
                }
            });
        }

        // 連続タスク完了日数の更新
        if (task.completed && !wasCompleted) { // 新しく完了した場合のみ
            const today = new Date().toISOString().split('T')[0];
            if (state.activityData.lastCompletedDate) {
                const lastCompleted = new Date(state.activityData.lastCompletedDate);
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                if (lastCompleted.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
                    state.activityData.consecutiveCompletedDays++;
                } else if (lastCompleted.toISOString().split('T')[0] !== today) {
                    state.activityData.consecutiveCompletedDays = 1;
                }
            } else {
                state.activityData.consecutiveCompletedDays = 1;
            }
            state.activityData.lastCompletedDate = today;
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
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    let confirmMsg = 'このタスクを削除しますか？';
    if (task.subtasks.length > 0) {
        confirmMsg = `このタスクには${task.subtasks.length}個のサブタスクがあります。
サブタスクも一緒に削除されますが、よろしいですか？`;
    }

    if (confirm(confirmMsg)) {
        const toDelete = new Set([id]);
        const collectSubtasks = (taskId) => {
            const t = state.tasks.find(task => task.id === taskId);
            if (t && t.subtasks.length > 0) {
                t.subtasks.forEach(subId => {
                    toDelete.add(subId);
                    collectSubtasks(subId);
                });
            }
        };
        collectSubtasks(id);

        state.tasks = state.tasks.filter(t => !toDelete.has(t.id));

        state.tasks.forEach(t => {
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
    const task = state.tasks.find(t => t.id === id);
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
    setCurrentFolder(folder);
    renderFolders();
    renderTasks();
    updateStats();
}


// フォルダ追加
function addFolder() {
    const name = prompt('新しいフォルダ名:');
    if (name && name.trim() && !state.folders.includes(name.trim())) {
        state.folders.push(name.trim());
        saveToLocalStorage();
        renderFolders();
        checkAchievements(); // フォルダ追加時にもチェック
    } else if (state.folders.includes(name.trim())) {
        alert('そのフォルダは既に存在します');
    }
}
function filterTasks(filter) {
    setCurrentFilter(filter);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderTasks();
}

// 検索
function searchTasks() {
    state.activityData.searchCount++; // 検索回数をカウント
    saveToLocalStorage();
    renderTasks();
    checkAchievements(); // 検索時にもチェック
}

// --- アチーブメント関連 ---
function checkAchievements() {
    const completedTasks = state.tasks.filter(t => t.completed);
    const completedCount = completedTasks.length;
    const accessCount = state.activityData.accessCount;
    const searchCount = state.activityData.searchCount;

    // 優先度別の完了タスク数
    const highPriorityCompleted = completedTasks.filter(t => t.priority === 'high').length;
    const mediumPriorityCompleted = completedTasks.filter(t => t.priority === 'medium').length;
    const lowPriorityCompleted = completedTasks.filter(t => t.priority === 'low').length;

    // 使用されているユニークなタグとフォルダ
    const uniqueTags = new Set();
    state.tasks.forEach(t => t.tags.forEach(tag => uniqueTags.add(tag)));
    const uniqueFolders = new Set(state.folders);

    // サブタスク関連
    const parentTasksWithSubtasksCompleted = completedTasks.filter(t => t.subtasks.length > 0).length;
    const subtasksCompletedCount = completedTasks.filter(t => t.parentId !== null).length;

    for (const id in state.achievements) {
        if (state.unlockedAchievements[id]) continue;

        const ach = state.achievements[id];
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
                        const subtask = state.tasks.find(st => st.id === subId);
                        return subtask && subtask.completed;
                    });
                });
                break;
            case 'consecutive_login':
                if (state.activityData.consecutiveLoginDays >= ach.condition.value) conditionMet = true;
                break;
            case 'consecutive_completed':
                if (state.activityData.consecutiveCompletedDays >= ach.condition.value) conditionMet = true;
                break;
            case 'easter_egg_click':
                if (state.activityData.easterEggClickCount >= ach.condition.value) conditionMet = true;
                break;
            case 'search_count':
                if (state.activityData.searchCount >= ach.condition.value) conditionMet = true;
                break;
        }

        if (conditionMet) {
            unlockAchievement(id);
        }
    }
}

function unlockAchievement(id) {
    if (state.unlockedAchievements[id]) return;

    const ach = state.achievements[id];
    showAchievementToast(ach);

    state.unlockedAchievements[id] = {
        unlockedAt: new Date().toISOString()
    };
    saveToLocalStorage();
    renderAchievements();
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
            state.activityData.easterEggClickCount++;
            saveToLocalStorage();
            checkAchievements();
        });
    }
}

function checkDataIntegrity() {
    const issues = [];
    const taskIds = new Set(state.tasks.map(t => t.id));

    state.tasks.forEach(task => {
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

// 初期化実行
init();

// Expose functions to global scope for HTML onclick handlers
window.addTask = addTask;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.editTask = editTask;
window.switchFolder = switchFolder;
window.addFolder = addFolder;
window.filterTasks = filterTasks;
window.searchTasks = searchTasks;
window.toggleTimeline = toggleTimeline;
window.scrollToTask = scrollToTask;
