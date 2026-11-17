package com.example.exlog.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserRequest(
        @NotBlank(message = "name is required") @Size(min = 2, max = 50, message = "name must be 2-50 characters") String name,
        @NotBlank(message = "email is required") @Email(message = "email must be a valid address") String email,
        @Min(value = 18, message = "age must be at least 18") int age) {}
