package com.example.backend.version.dto;

import java.util.UUID;

public class WorkingCopyContextResponse {

  private UUID mainTreeId;
  private UUID versionId;
  private String versionName;
  private String versionDescription;
  private String versionState;

  public WorkingCopyContextResponse(UUID mainTreeId, UUID versionId,
                                    String versionName, String versionDescription) {
    this(mainTreeId, versionId, versionName, versionDescription, "ACTIVE");
  }

  public WorkingCopyContextResponse(UUID mainTreeId, UUID versionId,
                                    String versionName, String versionDescription,
                                    String versionState) {
    this.mainTreeId = mainTreeId;
    this.versionId = versionId;
    this.versionName = versionName;
    this.versionDescription = versionDescription;
    this.versionState = versionState;
  }

  public UUID getMainTreeId() { return mainTreeId; }
  public UUID getVersionId() { return versionId; }
  public String getVersionName() { return versionName; }
  public String getVersionDescription() { return versionDescription; }
  public String getVersionState() { return versionState; }
}
