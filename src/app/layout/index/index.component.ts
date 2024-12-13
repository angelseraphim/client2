import { Component, OnInit, OnDestroy } from '@angular/core';
import { Post } from '../../models/Post';
import { PostService } from '../../service/post.service';
import { ImageUploadService } from '../../service/image-upload.service';
import { CommentService } from '../../service/comment.service';
import { NotificationService } from '../../service/notification.service';
import { Router } from '@angular/router';
import { UserService } from '../../service/user.service';
declare var DG: any;
@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit, OnDestroy {
  isPostsLoaded = false;
  isUserDataLoaded = false;
  posts: Post[] = [];
  user: any;
  constructor(
    private postService: PostService,
    private imageService: ImageUploadService,
    private commentService: CommentService,
    private notificationService: NotificationService,
    private router: Router,
    private userService: UserService
  ) {}
  postComment(message: string, postId: number, postIndex: number): void {
    if (!message.trim()) {
      this.notificationService.showSnackBar('Комментарий не может быть пустым');
      return;
    }
  
    this.commentService.addToCommentToPost(postId, message).subscribe(
      comment => {
        this.posts[postIndex].comments.push(comment);
        this.notificationService.showSnackBar('Комментарий добавлен');
      },
      error => {
        console.error('Ошибка при добавлении комментария:', error);
        this.notificationService.showSnackBar('Ошибка при добавлении комментария');
      }
    );
  }  
  likePost(postId: number, postIndex: number): void {
    const post = this.posts[postIndex];
  
    if (post.usersLiked.includes(this.user.username)) {
      this.postService.likePost(postId, this.user.username).subscribe(
        () => {
          const userIndex = post.usersLiked.indexOf(this.user.username);
          post.usersLiked.splice(userIndex, 1);
          this.notificationService.showSnackBar('Like removed');
        },
        error => {
          console.error('Error removing like:', error);
          this.notificationService.showSnackBar('Error removing like');
        }
      );
    } else {
      this.postService.likePost(postId, this.user.username).subscribe(
        () => {
          post.usersLiked.push(this.user.username);
          this.notificationService.showSnackBar('Post liked');
        },
        error => {
          console.error('Error liking post:', error);
          this.notificationService.showSnackBar('Error liking post');
        }
      );
    }
  }  
  ngAfterViewInit(): void {
    const script = document.createElement('script');
    script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full';
    document.body.appendChild(script);
  
    script.onload = () => {
      this.initializeMaps();
    };
  }
  ngOnInit(): void {
    const script = document.createElement('script');
    script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full';
    document.body.appendChild(script);
    script.onload = () => {
      this.postService.getAllPosts().subscribe(data => {
        this.posts = data;
        this.getImagesToPosts(this.posts);
        this.getCommentsToPosts(this.posts);
        this.isPostsLoaded = true;
        this.initializeMaps();
      });
      this.userService.getCurrentUser().subscribe(data => {
        this.user = data;
        this.isUserDataLoaded = true;
      });
    };
  }
  addEvent(): void {
    console.log('Add Event button clicked!');
    this.router.navigate(['/add']);
  }
  showEventsMap(): void {
    console.log('Events Map button clicked!');
    this.router.navigate(['/allmap']);
  }
  initializeMaps(): void {
    this.posts.forEach((post, index) => {
      if (post.location) {
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
      this.imageService.getImageToPost(p.id).subscribe(data => {
        p.image = data.imageBytes;
      });
    });
  }
  getCommentsToPosts(posts: Post[]): void {
    posts.forEach(p => {
      this.commentService.getCommentsToPost(p.id).subscribe(data => {
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
    if (this.posts && this.posts.length > 0) {
      this.posts.forEach((_, index) => {
        const mapId = 'map-' + index;
        const mapElement = document.getElementById(mapId);
        if (mapElement) {
          mapElement.innerHTML = '';
        }
      });
    }
  }
}