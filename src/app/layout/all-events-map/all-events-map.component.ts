import { Component, OnInit } from '@angular/core';
import { Post } from '../../models/Post';
import { PostService } from '../../service/post.service';
import { UserService } from '../../service/user.service';

declare var DG: any; // Объявляем DG для работы с 2ГИС API

@Component({
  selector: 'app-all-events-map',
  templateUrl: './all-events-map.component.html',
  styleUrls: ['./all-events-map.component.css']
})
export class AllEventsMapComponent implements OnInit {

  posts: Post[] = [];
  isPostsLoaded = false;

  constructor(
    private postService: PostService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const script = document.createElement('script');
    script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full';
    document.body.appendChild(script);

    script.onload = () => {
      this.loadEvents();
    };
  }

  loadEvents(): void {
    this.postService.getAllPosts().subscribe(data => {
      this.posts = data;
      this.isPostsLoaded = true;
      this.initializeMap();
    });
  }

  initializeMap(): void {
    const map = DG.map('all-events-map', {
      center: [51.128263, 71.430485], // Москва как дефолтный центр карты
      zoom: 5
    });

    this.posts.forEach(post => {
      if (post.location) {
        const coords = post.location.split(',').map(coord => parseFloat(coord.trim()));
        const latitude = coords[0];
        const longitude = coords[1];

        if (latitude && longitude) {
          DG.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`
              <strong>${post.title}</strong><br>
              <em>@${post.username}</em><br>
              ${post.caption}
            `);
        }
      }
    });
  }
}
