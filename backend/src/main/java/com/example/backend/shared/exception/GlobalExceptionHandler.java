package com.example.backend.shared.exception;

import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /** 400 — validation errors from @Valid */
  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
        .map(FieldError::getDefaultMessage)
        .collect(Collectors.joining("; "));
    return respond(HttpStatus.BAD_REQUEST, message.isEmpty() ? "Ошибка валидации" : message);
  }

  /** 400 — malformed JSON or unreadable body */
  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
    return respond(HttpStatus.BAD_REQUEST, "Некорректный формат запроса");
  }

  /** 404 — resource not found */
  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException ex) {
    return respond(HttpStatus.NOT_FOUND, ex.getMessage());
  }

  /** 400 — business logic violations */
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
    return respond(HttpStatus.BAD_REQUEST, ex.getMessage());
  }

  /** 403 — access denied */
  @ExceptionHandler(SecurityException.class)
  public ResponseEntity<ErrorResponse> handleSecurity(SecurityException ex) {
    return respond(HttpStatus.FORBIDDEN, "Доступ запрещён");
  }

  /** 409 — business state conflicts */
  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
    return respond(HttpStatus.CONFLICT, ex.getMessage());
  }

  /** 500 — unexpected errors */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
    log.error("Unhandled API exception", ex);
    return respond(HttpStatus.INTERNAL_SERVER_ERROR, "Внутренняя ошибка сервера");
  }

  private ResponseEntity<ErrorResponse> respond(HttpStatus status, String message) {
    return ResponseEntity.status(status).body(new ErrorResponse(status.value(), message));
  }
}
