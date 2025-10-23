export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return '今日';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return '明日';

    return `${date.getMonth() + 1}/${date.getDate()}`;
}
