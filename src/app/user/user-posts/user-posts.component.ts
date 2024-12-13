import { Component, OnInit, OnDestroy } from '@angular/core';
import { Post } from '../../models/Post';
import { PostService } from '../../service/post.service';
import { ImageUploadService } from '../../service/image-upload.service';
import { CommentService } from '../../service/comment.service';
import { NotificationService } from '../../service/notification.service';

declare var DG: any; // Объявляем DG для работы с 2ГИС API

@Component({
  selector: 'app-user-posts',
  templateUrl: './user-posts.component.html',
  styleUrls: ['./user-posts.component.css']
})
export class UserPostsComponent implements OnInit, OnDestroy {

  isUserPostsLoaded = false;
  posts: Post[];

  constructor(
    private postService: PostService,
    private imageService: ImageUploadService,
    private commentService: CommentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Загружаем скрипт 2ГИС асинхронно
    const script = document.createElement('script');
    script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full';
    document.body.appendChild(script);

    script.onload = () => {
      // Когда скрипт загружен, выполняем код
      this.postService.getPostForCurrentUser()
        .subscribe(data => {
          this.posts = data;
          this.getImagesToPosts(this.posts);
          this.getCommentsToPosts(this.posts);
          this.isUserPostsLoaded = true;

          // Инициализируем карты после загрузки данных
          this.initializeMaps();
        });
    };
  }

  // Инициализация карт для каждого поста
  initializeMaps(): void {
    this.posts.forEach((post, index) => {
      if (post.location) {
        // Разделяем строку location на широту и долготу
        const coords = post.location.split(',').map(coord => parseFloat(coord.trim()));
        const latitude = coords[0];
        const longitude = coords[1];

        if (latitude && longitude) {
          const mapId = 'map-' + index;
          DG.then(() => {
            const map = DG.map(mapId, {
              center: [latitude, longitude],
              zoom: 13
            });

            DG.marker([latitude, longitude])
              .addTo(map)
              .bindPopup(`Location: ${post.location}`);
          });
        }
      }
    });
  }

  getImagesToPosts(posts: Post[]): void {
    posts.forEach(p => {
      this.imageService.getImageToPost(p.id)
        .subscribe(data => {
          p.image = data.imageBytes;
        });
    });
  }

  getCommentsToPosts(posts: Post[]): void {
    posts.forEach(p => {
      this.commentService.getCommentsToPost(p.id)
        .subscribe(data => {
          p.comments = data;
        });
    });
  }

  removePost(post: Post, index: number): void {
    const result = confirm('Do you really want to delete this event?');
    if (result) {
      this.postService.deletePost(post.id)
        .subscribe(() => {
          this.posts.splice(index, 1);
          this.notificationService.showSnackBar('Event deleted');
        });
    }
  }

  formatImage(img: any): any {
    if (img == null) {
      return null;
    }
    return 'data:image/jpeg;base64,' + img;
  }

  deleteComment(commentId: number, postIndex: number, commentIndex: number): void {
    const post = this.posts[postIndex];
    this.commentService.deleteComment(commentId)
      .subscribe(() => {
        this.notificationService.showSnackBar('Comment removed');
        post.comments.splice(commentIndex, 1);
      });
  }

  ngOnDestroy() {
    // Очистка карт и других ресурсов при уничтожении компонента
    if (this.posts && this.posts.length > 0) {
      this.posts.forEach((_, index) => {
        const mapId = 'map-' + index;
        const mapElement = document.getElementById(mapId);
        if (mapElement) {
          mapElement.innerHTML = ''; // Удаляем карту из DOM
        }
      });
    }
  }
}
