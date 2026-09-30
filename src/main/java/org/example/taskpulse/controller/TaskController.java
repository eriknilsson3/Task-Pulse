package org.example.taskpulse.controller;

import jakarta.validation.Valid;
import org.example.taskpulse.dto.CreateTaskRequest;
import org.example.taskpulse.dto.UpdateTaskRequest;
import org.example.taskpulse.task.Task;
import org.example.taskpulse.task.TaskStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.example.taskpulse.service.TaskService;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService service;

    public TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    public List<Task> findAll(
            @RequestParam(required = false) TaskStatus status) {

        return service.findAll(status);
    }

    @GetMapping("/{id}")
    public Task findById(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Task create(
            @Valid @RequestBody CreateTaskRequest request) {

        return service.create(request);
    }

    @PutMapping("/{id}")
    public Task update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request) {

        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}