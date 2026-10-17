package com.business.exception;

/** Thrown when a request conflicts with existing data (e.g. duplicate email). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
