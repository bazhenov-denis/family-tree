package com.example.backend.auth.dto;

public class UpdateProfileRequest {

  private String name;
  private String currentPassword;
  private String newPassword;

  public String getName()            { return name;            }
  public void setName(String v)      { this.name = v;          }

  public String getCurrentPassword()        { return currentPassword;        }
  public void setCurrentPassword(String v)  { this.currentPassword = v;      }

  public String getNewPassword()        { return newPassword;        }
  public void setNewPassword(String v)  { this.newPassword = v;      }
}
