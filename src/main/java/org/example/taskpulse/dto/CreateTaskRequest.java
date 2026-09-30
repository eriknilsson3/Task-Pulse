package org.example.taskpulse.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTaskRequest(

        @NotBlank(message = "Title is required")
        @Size(max = 100, message = "Title must be 100 characters or less")
        String title,

        @Size(max = 500, message = "Description must be 500 characters or less")
        String description
) {
}