const list = document.querySelector('#tasks');
const form = document.querySelector('#task-form');
const title = document.querySelector('#title');
const filter = document.querySelector('#filter');
const message = document.querySelector('#message');
let requestNumber = 0;
async function api(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json' } });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed. Please try again.');
  return data;
}
async function loadTasks() {
  const current = ++requestNumber;
  try {
    const { tasks } = await api(`/api/tasks${filter.value ? `?status=${filter.value}` : ''}`);
    if (current !== requestNumber) return;
    list.replaceChildren();
    document.querySelector('#count').textContent = tasks.length;
    document.querySelector('#empty').hidden = tasks.length > 0;
    document.querySelector('#empty').textContent = filter.value ? 'No tasks with this status.' : 'No tasks yet. Add your first one above.';
    for (const task of tasks) {
      const item = document.createElement('li');
      item.className = task.status;
      const text = document.createElement('span');
      text.className = 'task-title';
      text.textContent = task.title;
      const select = document.createElement('select');
      select.setAttribute('aria-label', `Status for ${task.title}`);
      for (const [value, label] of [['todo', 'To do'], ['in-progress', 'In progress'], ['done', 'Done']]) {
        select.add(new Option(label, value, false, value === task.status));
      }
      select.addEventListener('change', async () => {
        select.disabled = true;
        try {
          await api(`/api/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) });
          message.textContent = '';
          await loadTasks();
        } catch (error) { message.textContent = error.message; select.value = task.status; }
        finally { select.disabled = false; }
      });
      const remove = document.createElement('button');
      remove.className = 'delete';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete ${task.title}`);
      remove.addEventListener('click', async () => {
        remove.disabled = true;
        try { await api(`/api/tasks/${task.id}`, { method: 'DELETE' }); message.textContent = ''; await loadTasks(); }
        catch (error) { message.textContent = error.message; }
        finally { remove.disabled = false; }
      });
      item.append(text, select, remove);
      list.append(item);
    }
  } catch (error) { if (current === requestNumber) message.textContent = error.message; }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    await api('/api/tasks', { method: 'POST', body: JSON.stringify({ title: title.value }) });
    title.value = '';
    message.textContent = '';
    await loadTasks();
    title.focus();
  } catch (error) { message.textContent = error.message; }
  finally { button.disabled = false; }
});
filter.addEventListener('change', loadTasks);
loadTasks();
