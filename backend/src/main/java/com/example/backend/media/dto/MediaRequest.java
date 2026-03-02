package com.example.backend.media.dto;

import jakarta.validation.constraints.NotBlank;

public class MediaRequest {

  @NotBlank
  private String url;

  private String description;
  private String mimeType;
  private String fileName;

  public String getUrl()         { return url; }
  public String getDescription() { return description; }
  public String getMimeType()    { return mimeType; }
  public String getFileName()    { return fileName; }
}
