package com.example.backend.media.entity;

import com.example.backend.event.entity.Event;
import com.example.backend.person.entity.Person;
import com.example.backend.shared.entity.BaseEntity;
import com.example.backend.tree.entity.FamilyTree;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "media")
public class Media extends BaseEntity {

  @ManyToOne
  private FamilyTree tree;

  @ManyToOne
  @JoinColumn(name = "person_id")
  private Person person;

  @ManyToOne
  @JoinColumn(name = "event_id")
  private Event event;

  private String url;
  private String description;

  // legacy fields kept for schema compatibility
  private String fileName;
  private String mimeType;
  private String storageKey;

  protected Media() { }

  public Media(FamilyTree tree, Person person, String url, String description) {
    this.tree = tree;
    this.person = person;
    this.url = url;
    this.description = description;
  }

  public Media(FamilyTree tree, Person person, String url, String description,
               String mimeType, String fileName) {
    this(tree, person, url, description);
    this.mimeType = mimeType;
    this.fileName = fileName;
  }

  public Media(FamilyTree tree, Event event, String url, String description,
               String mimeType, String fileName) {
    this.tree     = tree;
    this.event    = event;
    this.url      = url;
    this.description = description;
    this.mimeType = mimeType;
    this.fileName = fileName;
  }

  public FamilyTree getTree()    { return tree; }
  public Person getPerson()      { return person; }
  public Event getEvent()        { return event; }
  public String getUrl()         { return url; }
  public String getDescription() { return description; }
  public String getMimeType()    { return mimeType; }
  public String getFileName()    { return fileName; }

  public void setDescription(String description) { this.description = description; }
}
