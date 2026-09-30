package org.example.taskpulse.service;
import org.example.taskpulse.dto.CreateTaskRequest;
import org.example.taskpulse.dto.UpdateTaskRequest;
import org.example.taskpulse.error.TaskNotFoundException;
import org.example.taskpulse.task.Task;
import org.example.taskpulse.task.TaskStatus;
import org.springframework.stereotype.Service;
import org.example.taskpulse.repository.TaskRepository;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository repository;

    public TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    public List<Task> findAll(TaskStatus status) {
        if (status == null) {
            return repository.findAll();
        }

        return repository.findByStatus(status);
    }

    public Task findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new TaskNotFoundException(id));
    }

    public Task create(CreateTaskRequest request) {
        Task task = new Task(
                request.title(),
                request.description()
        );

        return repository.save(task);
    }

    public Task update(Long id, UpdateTaskRequest request) {
        Task task = findById(id);

        task.update(
                request.title(),
                request.description(),
                request.status()
        );

        return repository.save(task);
    }

    public void delete(Long id) {
        Task task = findById(id);
        repository.delete(task);
    }
}