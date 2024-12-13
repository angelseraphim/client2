import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-map',
  template: '<div id="map" style="width: 100%; height: 500px;"></div>',
})
export class MapComponent implements OnInit {
  private map: any;
  private currentMarker: any;

  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number }>();

  ngOnInit(): void {
    const script = document.createElement('script');
    script.src = 'https://maps.api.2gis.ru/2.0/loader.js?pkg=full';
    document.body.appendChild(script);

    script.onload = () => {
      DG.then(() => {
        this.map = DG.map('map', {
          center: [51.128235, 71.430506],
          zoom: 13,
        });

        this.map.on('click', (event: any) => {
          const { lat, lng } = event.latlng;

          if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
          }

          this.currentMarker = DG.marker([lat, lng]).addTo(this.map);

          // Эмитируем событие с координатами
          this.locationSelected.emit({ lat, lng });
        });
      });
    };
  }
}
