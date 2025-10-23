export const state = {
    tasks: [],
    folders: ['個人', '仕事', 'プロジェクト'],
    currentFilter: 'all',
    currentFolder: null,
    taskIdCounter: 1,
    activityData: {
        accessCount: 0,
        loginDays: 1,
        consecutiveLoginDays: 1,
        lastAccessDate: null,
        lastCompletedDate: null,
        consecutiveCompletedDays: 0,
        easterEggClickCount: 0,
        searchCount: 0
    },
    achievements: {},
    unlockedAchievements: {},
};

export function setInitialState(initialState) {
    state.tasks = initialState.tasks;
    state.folders = initialState.folders;
    state.taskIdCounter = initialState.taskIdCounter;
    state.activityData = initialState.activityData;
    state.unlockedAchievements = initialState.unlockedAchievements;
}

export function setCurrentFolder(folder) {
    state.currentFolder = folder;
}

export function setCurrentFilter(filter) {
    state.currentFilter = filter;
}

export function saveToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
    localStorage.setItem('folders', JSON.stringify(state.folders));
    localStorage.setItem('taskIdCounter', state.taskIdCounter);
    localStorage.setItem('activityData', JSON.stringify(state.activityData));
    localStorage.setItem('unlockedAchievements', JSON.stringify(state.unlockedAchievements));
}

export function loadFromLocalStorage() {
    const savedTasks = localStorage.getItem('tasks');
    const savedFolders = localStorage.getItem('folders');
    const savedCounter = localStorage.getItem('taskIdCounter');
    const savedActivity = localStorage.getItem('activityData');
    const savedUnlocked = localStorage.getItem('unlockedAchievements');

    const defaultActivityData = {
        accessCount: 0,
        loginDays: 1,
        consecutiveLoginDays: 1,
        lastAccessDate: null,
        lastCompletedDate: null,
        consecutiveCompletedDays: 0,
        easterEggClickCount: 0,
        searchCount: 0
    };

    const loadedTasks = savedTasks ? JSON.parse(savedTasks) : [];
    loadedTasks.forEach(task => {
        if (!task.folder) task.folder = '個人';
    });

    return {
        tasks: loadedTasks,
        folders: savedFolders ? JSON.parse(savedFolders) : ['個人', '仕事', 'プロジェクト'],
        taskIdCounter: savedCounter ? parseInt(savedCounter) : 1,
        activityData: savedActivity ? JSON.parse(savedActivity) : defaultActivityData,
        unlockedAchievements: savedUnlocked ? JSON.parse(savedUnlocked) : {}
    };
}

export function cleanupOrphanedTasks() {
    const taskIds = new Set(state.tasks.map(t => t.id));
    let cleaned = false;

    state.tasks.forEach(task => {
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