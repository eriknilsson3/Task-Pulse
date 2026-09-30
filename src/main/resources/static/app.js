const state = {
  tasks: [],
  filter: 'ALL',
  editingId: null,
};

const elements = {
  taskList: document.querySelector('#task-list'),
  statusBanner: document.querySelector('#status-banner'),
  pageTitle: document.querySelector('#page-title'),
  listTitle: document.querySelector('#list-title'),
  statTotal: document.querySelector('#stat-total'),
  statActive: document.querySelector('#stat-active'),
  statDone: document.querySelector('#stat-done'),
  statCompletion: document.querySelector('#stat-completion'),
  countAll: document.querySelector('#count-all'),
  countTodo: document.querySelector('#count-todo'),
  countProgress: document.querySelector('#count-progress'),
  countDone: document.querySelector('#count-done'),
  dialog: document.querySelector('#task-dialog'),
  form: document.querySelector('#task-form'),
  dialogEyebrow: document.querySelector('#dialog-eyebrow'),
  dialogTitle: document.querySelector('#dialog-title'),
  taskId: document.querySelector('#task-id'),
  taskTitle: document.querySelector('#task-title'),
  taskDescription: document.querySelector('#task-description'),
  taskStatus: document.querySelector('#task-status'),
  statusField: document.querySelector('#status-field'),
  saveTask: document.querySelector('#save-task'),
};

const api = {
  async list(status) {
    const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/api/tasks${query}`);
  },
  async create(payload) {
    return request('/api/tasks', { method: 'POST', body: payload });
  },
  async update(id, payload) {
    return request(`/api/tasks/${id}`, { method: 'PUT', body: payload });
  },
  async remove(id) {
    return request(`/api/tasks/${id}`, { method: 'DELETE' });
  },
};

async function request(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  }
  return payload;
}

async function loadTasks() {
  showMessage('');
  try {
    const tasks = await api.list();
    state.tasks = tasks.sort((a, b) => Number(a.id) - Number(b.id));
    render();
  } catch (error) {
    state.tasks = [];
    render();
    showMessage(error.message || 'Could not load tasks.');
  }
}

function render() {
  updateStats();
  renderTaskList();
}

function updateStats() {
  const total = state.tasks.length;
  const todo = state.tasks.filter((task) => task.status === 'TODO').length;
  const progress = state.tasks.filter((task) => task.status === 'IN_PROGRESS').length;
  const done = state.tasks.filter((task) => task.status === 'DONE').length;
  const completion = total ? Math.round((done / total) * 100) : 0;

  elements.statTotal.textContent = total;
  elements.statActive.textContent = todo + progress;
  elements.statDone.textContent = done;
  elements.statCompletion.textContent = `${completion}% of all tasks`;
  elements.countAll.textContent = total;
  elements.countTodo.textContent = todo;
  elements.countProgress.textContent = progress;
  elements.countDone.textContent = done;
}

function renderTaskList() {
  const labels = {
    ALL: 'All tasks',
    TODO: 'To do',
    IN_PROGRESS: 'In progress',
    DONE: 'Done',
  };
  const visibleTasks = state.filter === 'ALL'
    ? state.tasks
    : state.tasks.filter((task) => task.status === state.filter);

  elements.pageTitle.textContent = state.filter === 'ALL' ? 'Your task pulse' : labels[state.filter];
  elements.listTitle.textContent = labels[state.filter];

  if (!visibleTasks.length) {
    elements.taskList.innerHTML = `
      <div class="empty-state">
        <h4>${state.tasks.length ? 'Nothing here yet' : 'Your board is ready'}</h4>
        <p>${state.tasks.length ? 'Try another status filter or move a task into this lane.' : 'Create your first task and give the day a clear next step.'}</p>
      </div>
    `;
    return;
  }

  elements.taskList.innerHTML = visibleTasks.map(taskCard).join('');
  elements.taskList.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => openEditDialog(Number(button.dataset.id)));
  });
  elements.taskList.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => deleteTask(Number(button.dataset.id)));
  });
}

function taskCard(task) {
  const statusMeta = {
    TODO: { label: 'To do', mark: '01', className: '' },
    IN_PROGRESS: { label: 'In progress', mark: '02', className: 'progress' },
    DONE: { label: 'Done', mark: '03', className: 'done' },
  }[task.status] || { label: task.status, mark: '•', className: '' };
  const description = task.description ? escapeHtml(task.description) : 'No description added.';

  return `
    <article class="task-card">
      <div class="status-mark status-${task.status}" aria-hidden="true">${statusMeta.mark}</div>
      <div class="task-copy">
        <h4>${escapeHtml(task.title)}</h4>
        <p>${description}</p>
        <div class="task-meta">
          <span class="badge ${statusMeta.className}">${statusMeta.label}</span>
          <span class="badge">Task #${task.id}</span>
        </div>
      </div>
      <div class="task-actions">
        <button class="icon-button" data-action="edit" data-id="${task.id}" type="button" aria-label="Edit ${escapeHtml(task.title)}">Edit</button>
        <button class="icon-button" data-action="delete" data-id="${task.id}" type="button" aria-label="Delete ${escapeHtml(task.title)}">Delete</button>
      </div>
    </article>
  `;
}

function setFilter(filter) {
  state.filter = filter;
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.filter === filter);
  });
  renderTaskList();
}

function openCreateDialog() {
  state.editingId = null;
  elements.form.reset();
  elements.taskStatus.value = 'TODO';
  elements.taskId.value = '';
  elements.dialogEyebrow.textContent = 'Create';
  elements.dialogTitle.textContent = 'Add a new task';
  elements.saveTask.textContent = 'Create task';
  elements.statusField.classList.add('hidden');
  elements.dialog.showModal();
  elements.taskTitle.focus();
}

function openEditDialog(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;

  state.editingId = id;
  elements.taskId.value = String(id);
  elements.taskTitle.value = task.title;
  elements.taskDescription.value = task.description || '';
  elements.taskStatus.value = task.status;
  elements.dialogEyebrow.textContent = 'Update';
  elements.dialogTitle.textContent = 'Edit task';
  elements.saveTask.textContent = 'Save changes';
  elements.statusField.classList.remove('hidden');
  elements.dialog.showModal();
  elements.taskTitle.focus();
}

function closeDialog() {
  elements.dialog.close();
}

async function saveTask(event) {
  event.preventDefault();
  const title = elements.taskTitle.value.trim();
  const description = elements.taskDescription.value.trim();

  if (!title) return;

  elements.saveTask.disabled = true;
  showMessage('');
  try {
    if (state.editingId) {
      await api.update(state.editingId, {
        title,
        description: description || null,
        status: elements.taskStatus.value,
      });
    } else {
      await api.create({ title, description: description || null });
    }
    closeDialog();
    await loadTasks();
  } catch (error) {
    showMessage(error.message || 'Could not save the task.');
  } finally {
    elements.saveTask.disabled = false;
  }
}

async function deleteTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  if (!window.confirm(`Delete “${task.title}”?`)) return;

  showMessage('');
  try {
    await api.remove(id);
    await loadTasks();
  } catch (error) {
    showMessage(error.message || 'Could not delete the task.');
  }
}

function showMessage(message) {
  elements.statusBanner.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

document.querySelectorAll('.nav-item').forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});
document.querySelector('#open-create').addEventListener('click', openCreateDialog);
document.querySelector('#refresh-tasks').addEventListener('click', loadTasks);
document.querySelector('#close-dialog').addEventListener('click', closeDialog);
document.querySelector('#cancel-dialog').addEventListener('click', closeDialog);
elements.form.addEventListener('submit', saveTask);

loadTasks();
