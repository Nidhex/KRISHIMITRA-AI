# Krishi Feed & Community Forum

## Overview

The **Krishi Feed & Community Forum** allows farmers to read verified agricultural news, government circulars, crop management tips, and participate in peer-to-peer farmer discussions (asking questions, sharing crop success photos, upvoting helpful advice).

## Visual UML Sequence & Fallback Diagram
![Krishi Feed & Community Forum](./images/krishi_feed_community_diagram_1789524026997.jpg)

---

## 1. Krishi Feed & Post Interaction Flowchart

```mermaid
flowchart TD
    Start(["📰 Farmer Opens Krishi Feed"]) --> ChooseTab{"Select Content View"}
    
    ChooseTab -->|Official News| FetchNews["📡 Load Verified Agronomic News & Govt Updates"]
    ChooseTab -->|Community Q&A| FetchPosts["📡 Load Farmer Community Posts & Q&A"]

    FetchPosts --> FilterCategory{"Category Filter"}
    FilterCategory -->|All Posts| ListAll["📋 Display All Community Posts"]
    FilterCategory -->|Specific Crop| FilterCrop["🔍 Filter by Crop (Wheat, Paddy, Organic Farming, Pest Control)"]

    ListAll --> RenderFeed["📱 Render Feed Cards (Author, Verified Badge, Image, Content, Likes, Comments)"]
    FilterCrop --> RenderFeed

    RenderFeed --> UserAction{"Farmer Action"}
    
    UserAction -->|Upvote| TapLike["👍 Tap Upvote -> Increment Like Count & Sync Backend"]
    UserAction -->|Comment| OpenComment["💬 Open Comment Modal & Submit Reply"]
    UserAction -->|New Post| CreatePost["➕ Tap Create Post -> Add Crop Photo & Description"]

    CreatePost --> SavePost["📡 POST /api/feed/create -> Store in Community Feed"]
    SavePost --> RefreshFeed["🔄 Refresh Feed Automatically"]
```

---

## 2. Community Post Creation & Interaction Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 👨‍🌾 Farmer
    participant UI as 📰 Krishi Feed Screen UI
    participant Service as ⚙️ Feed Service / apiClient
    participant Cache as 💾 Local Storage Cache
    participant Backend as ☁️ Render Feed API

    Farmer->>UI: Taps "Ask Community" / Create Post
    UI->>UI: Open Modal (Text input + Image picker)
    Farmer->>UI: Enters "गेहूं की बाली सफेद क्यों हो रही है?" + Attaches Leaf Photo
    UI->>Service: createPost({ text, crop: "Wheat", imageUri })
    
    Service->>Backend: POST /api/feed/posts (Multipart Form Data)
    Backend->>Backend: Save post in DB & trigger expert review notification
    Backend-->>Service: Return created Post object
    
    Service->>Cache: Prepend post to local cache
    Service-->>UI: Post created success
    UI-->>Farmer: Render new post at top of feed with "Just Now" timestamp
```

---

## 3. Feed Data Model Diagram

```mermaid
classDiagram
    class FeedPost {
        +string postId
        +string authorId
        +string authorName
        +string authorLocation
        +boolean isExpertVerified
        +string crop
        +string category
        +string textContent
        +string imageUrl
        +number upvoteCount
        +number commentCount
        +boolean isUpvotedByMe
        +string createdAt
        +Comment[] comments
    }

    class Comment {
        +string commentId
        +string authorName
        +string text
        +string createdAt
    }

    FeedPost *-- Comment
```

---

## Key Community Features

- **Expert Verification Badge**: Posts or answers authored by verified Krishi Vigyan Kendra (KVK) scientists or agricultural extension officers display a blue checkmark badge (`Verified Expert`).
- **Offline Post Reading**: Previously loaded feed items and news articles are cached locally for offline reading when farmers are in fields without network coverage.
