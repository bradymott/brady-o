/* ============================================================
   World tour: the maps. The world route map (pins on a stylized
   globe, the plane, the Baron's airship) and the scene that
   switches between it and each land's walkable overworld.
   ============================================================ */
// simplified coastlines as [lon, lat] rings (hand-made, stylized)
const TOUR_LAND = [
  // North & Central America
  [-168, 65, -162, 70, -156, 71.3, -140, 69.6, -128, 70, -115, 68.6, -105, 68.2, -95, 69, -94, 61, -88, 57, -82.5, 52.5, -79, 55, -77, 60.5, -71, 61.5, -64.5, 60, -61, 56.5, -56, 52, -53, 47.5, -59.5, 45.8, -65.5, 44, -70.5, 43, -74, 40.6, -75.8, 37.5, -75.6, 35.2, -78, 33.8, -81.2, 31.5, -80.1, 27, -80.6, 25.2, -81.8, 26.8, -82.8, 28.9, -84.5, 30, -89, 30.3, -91.5, 29.5, -94.5, 29.5, -97.2, 27.5, -97.7, 24, -97.2, 21, -96.2, 19.3, -94.5, 18.2, -91.8, 18.6, -90.4, 20.8, -87.6, 21.4, -87.4, 19.5, -88.3, 17.5, -88.5, 15.9, -84, 15.9, -83.5, 13.5, -83.7, 11.2, -82.2, 9.2, -79.6, 9.5, -77.4, 8.7, -78, 7.2, -79.9, 7.4, -80.8, 7.8, -82.6, 8.2, -85.7, 10, -85.8, 11.4, -87.6, 13.2, -91.4, 13.9, -94.4, 16.1, -96.4, 15.7, -99.7, 16.7, -103.5, 18.3, -105.6, 20.4, -105.3, 21.8, -106.4, 23.3, -108.8, 25.4, -111, 27.8, -112.8, 30.4, -114.7, 31.6, -113.6, 29.5, -112.4, 27.8, -110.5, 24.2, -109.6, 23.2, -110.3, 23.8, -112.2, 24.8, -112.3, 26.8, -114.3, 28.3, -115.8, 30.3, -117.2, 32.6, -118.5, 34.1, -120.6, 34.6, -122.4, 37.6, -123.8, 39.6, -124.3, 42, -124.1, 46.2, -124.7, 48.4, -127.5, 50.6, -130.2, 54.6, -133.5, 57.5, -137.5, 58.9, -141, 60.1, -146.5, 60.7, -151.5, 59.5, -153.5, 57.5, -158.5, 56.2, -162.5, 55, -158.5, 58.5, -162, 59.8, -165.4, 62, -164.6, 63.5, -168, 65],
  // Greenland
  [-73, 78.2, -64, 81.5, -45, 82.5, -25, 82, -18.5, 79.5, -19.5, 74.5, -22, 70.5, -27.5, 68.3, -34, 66, -40, 64.8, -43, 60, -47.5, 61, -50.5, 64.2, -53, 66.8, -54.5, 70, -56, 73.2, -61, 76.2, -73, 78.2],
  // South America
  [-77.4, 8.7, -75.6, 10.6, -73, 11.4, -71.8, 12.4, -70.2, 11.6, -68.3, 10.6, -64.3, 10.6, -61.8, 10.6, -60.8, 8.6, -58.3, 7, -55.5, 5.9, -52.5, 4.8, -50.8, 2.2, -50, 0.2, -48.3, -1.2, -44.5, -2.4, -41, -3, -38.3, -3.8, -35.3, -5.3, -34.9, -7.8, -35.2, -9.5, -37, -11.2, -38.6, -13.4, -39, -16.6, -39.8, -19.6, -41, -21.8, -42.4, -22.9, -44.6, -23.2, -46.5, -24, -48.6, -26.4, -48.7, -28.4, -50.2, -30.4, -51.3, -31.9, -53.4, -33.8, -55.3, -34.8, -57.2, -35.3, -57.6, -37.9, -61.8, -39, -62.3, -40.7, -65, -41.1, -64.4, -42.8, -65.5, -45, -67.4, -46.3, -66.3, -48, -68.5, -50.4, -69.1, -52.3, -68.4, -53.6, -66, -54.9, -68.7, -55.5, -71.5, -54.2, -74.5, -52.4, -75.6, -48.5, -74.4, -45.5, -73.7, -42.6, -73.9, -39.5, -73.2, -36.8, -71.7, -33.6, -71.5, -30, -71.3, -27.5, -70.5, -23.5, -70.2, -19.5, -70.6, -18.3, -73, -16.8, -75.2, -15.3, -76.6, -13.3, -78.4, -10.4, -79.6, -7.4, -81.2, -5.8, -81.3, -4.3, -80.3, -3.3, -80.9, -1.5, -80.3, 0.4, -79.4, 1.5, -78.6, 2.3, -77.4, 4.1, -77.4, 6.5, -77.4, 8.7],
  // Eurasia (Portugal → Mediterranean → Arabia → India → SE Asia → China → Siberia → Scandinavia → Baltic → North Sea → Iberia)
  [-9, 37, -6.2, 36.7, -5.5, 36.1, -2.3, 36.8, -0.6, 38, -0.2, 39.5, 0.9, 41, 3.2, 42, 3.1, 43.2, 4.7, 43.4, 7.5, 43.8, 9.2, 44.3, 10.3, 43.5, 11.2, 42.4, 12.6, 41.6, 15.6, 40, 16.1, 38.1, 17.1, 39, 18.5, 40.2, 16.1, 41.4, 14.1, 42.5, 13.6, 43.5, 12.3, 45.4, 13.7, 45.7, 15.2, 44.3, 18.5, 42.5, 19.6, 41.6, 19.4, 40.2, 21.1, 37.8, 22.4, 36.5, 23.2, 37.4, 23.7, 38.4, 22.9, 39.6, 23.6, 40.2, 26.1, 40.8, 29, 41.1, 28, 41.6, 28.6, 43.4, 29.7, 45.2, 31.4, 46.6, 33.6, 46.1, 36.6, 45.4, 39.2, 47.1, 38.2, 46.3, 37.7, 44.7, 40, 43.4, 41.6, 41.6, 39.3, 41, 36.1, 41.7, 33.3, 42, 31.2, 41.1, 29.3, 41.1, 27.8, 40.4, 26.2, 39.4, 27.3, 37.4, 28.2, 36.7, 30.6, 36.8, 32.6, 36.1, 34.6, 36.8, 36.1, 36.6, 35.8, 35.3, 35.5, 33.8, 35, 32.8, 34.5, 31.5, 34.2, 31.3, 34.9, 29.5, 36.7, 27.6, 38.2, 24.1, 39.2, 21.5, 40.8, 18.9, 42.7, 15.8, 43.5, 12.7, 45.2, 13, 48.4, 14, 51.6, 15.3, 54.1, 16.9, 56.4, 18.3, 57.8, 19.8, 59.8, 22.5, 58.6, 23.6, 56.4, 26.3, 55.3, 25.3, 54, 24.2, 51.7, 25.2, 51.2, 26.1, 50.2, 26.3, 48.8, 28.3, 48, 30, 50.3, 29.6, 51.4, 27.7, 54.5, 26.6, 56.6, 27.2, 58.6, 25.7, 61.6, 25.2, 64.7, 25.2, 66.6, 25.4, 68.2, 23.7, 70.2, 22.6, 72.6, 21.2, 72.8, 19, 73.4, 16, 74.6, 13.3, 75.6, 11.3, 76.3, 9.8, 77.5, 8.1, 78.2, 8.9, 79.3, 10.3, 80.3, 13.1, 80.2, 15.6, 82.3, 16.6, 84.9, 19.3, 86.9, 21, 88.2, 21.7, 90.5, 22.1, 91.8, 22.4, 92.4, 20.7, 94.3, 18.6, 94.4, 16, 95.4, 15.8, 97.7, 16.5, 98.3, 13.5, 98.5, 10.5, 98.3, 8, 99.8, 6.4, 100.4, 5.2, 101.3, 2.9, 103.5, 1.4, 104.3, 1.6, 103.4, 4.5, 102.3, 6.2, 100.6, 7.2, 99.9, 9.3, 99.3, 10.6, 100, 12.6, 100.6, 13.5, 101.9, 12.6, 102.8, 11.6, 103.6, 10.5, 104.8, 8.6, 106.7, 10.4, 108.9, 11.5, 109.4, 13.8, 108.3, 16, 106.6, 18.4, 105.8, 19.6, 106.7, 20.6, 108.1, 21.5, 109.7, 21.5, 110.3, 20.4, 111.6, 21.6, 113.5, 22.2, 116.4, 23, 117.9, 24.5, 119.6, 25.9, 120.5, 27.4, 121.8, 29.2, 121.9, 30.8, 121.3, 32.1, 120.3, 34.3, 119.3, 35, 120.4, 36.2, 122.6, 37.4, 121.3, 37.6, 119.3, 37.2, 118, 38.6, 117.7, 39.2, 119.6, 40, 121.2, 40.9, 121.4, 39.4, 124.3, 39.9, 125.3, 39.5, 125.4, 38, 126.6, 37.5, 126.4, 36, 126.4, 34.6, 127.6, 34.6, 129.3, 35.2, 129.4, 36.5, 128.6, 38.5, 127.6, 39.8, 129.7, 40.9, 129.9, 42.4, 131.9, 43.1, 133.2, 42.8, 135.4, 43.8, 137.7, 45.8, 139.6, 48.2, 140.5, 50.7, 141.3, 53.1, 139.2, 54.2, 136.8, 54.6, 137.4, 56.3, 140.5, 57.9, 143.3, 59.4, 147.5, 59.3, 151.3, 59.6, 155, 59.2, 156.2, 57.5, 155.5, 55.2, 156.7, 51, 158.4, 52.9, 160, 54.4, 162.1, 56.1, 163.3, 58, 162.3, 59.3, 165.1, 60.3, 170.3, 60, 174, 61.7, 177.5, 62.6, 179.9, 65, 178.5, 66.4, 179.9, 68.8, 172, 69.8, 166, 69.6, 160.5, 70, 152.5, 70.8, 145, 72.2, 138, 71.5, 131, 71, 128.8, 72.8, 122.5, 73.2, 117, 73.6, 112.5, 75.8, 107, 77.2, 104.2, 77.7, 98.5, 76.2, 93.5, 75.9, 88.5, 75.1, 86.8, 74, 81, 73.6, 80.5, 72.2, 74, 72.8, 73.3, 71.2, 72.5, 69, 69.4, 68.9, 66.2, 69.6, 61, 69.8, 58.5, 68.4, 54.5, 68.2, 50.5, 67.9, 44.2, 68.5, 43.3, 66.2, 40.2, 67.1, 41.2, 66.4, 38.8, 66.1, 35.7, 66.6, 32.8, 67.8, 36, 69, 33.1, 69.4, 28.8, 70.2, 25.8, 71.1, 21.3, 70.2, 18.6, 69.7, 15.2, 68.7, 13.4, 66.9, 12.4, 65.5, 10.6, 63.9, 7.5, 63, 5.2, 62.1, 4.9, 60.7, 5.2, 59.2, 5.7, 58.9, 7.1, 58, 9.3, 58.8, 10.6, 59.8, 11.2, 59.1, 12, 57.6, 12.6, 56.2, 12.9, 55.4, 14.3, 55.6, 16, 56.3, 16.6, 57.3, 18.1, 59.3, 17.3, 60.6, 17.3, 62.3, 18.8, 63.5, 21.3, 64.5, 22.6, 65.8, 24.8, 65.7, 25.4, 65, 23.5, 63.9, 21.4, 62.5, 21.5, 60.9, 22.9, 59.8, 25.4, 60.3, 28, 60.5, 30.3, 59.9, 28.1, 59.4, 26.6, 59.4, 23.5, 59.2, 23.5, 58.3, 24.4, 57.6, 24.1, 57, 21.6, 57.4, 21, 56.4, 21.2, 55.7, 19.9, 54.9, 18.6, 54.4, 16.6, 54.6, 14.3, 53.9, 12.5, 54.4, 11, 54, 10.8, 54.6, 10.4, 55.2, 10.6, 56.4, 10.6, 57.7, 9.9, 57.6, 8.3, 56.8, 8.1, 55.5, 8.6, 54.9, 8.9, 53.9, 7.2, 53.5, 5, 53.4, 4.7, 52.9, 4.2, 52, 3.4, 51.4, 2.6, 51.1, 1.7, 50.9, 1.4, 50.1, 0.2, 49.5, -1.2, 49.4, -1.7, 49.7, -1.9, 48.7, -3.4, 48.8, -4.7, 48.4, -4.1, 47.8, -2.5, 47.3, -1.2, 46.2, -1.3, 44.7, -1.6, 43.4, -3.8, 43.5, -5.9, 43.6, -8.3, 43.4, -9.3, 42.9, -8.8, 41.8, -8.7, 40.6, -9.5, 38.7, -8.8, 38.1, -9, 37],
  // Africa
  [-5.9, 35.8, -2.2, 35.1, 1, 36.5, 3.1, 36.8, 6.4, 37.1, 8.6, 36.9, 10.2, 37.3, 11.1, 36.9, 10.6, 35.7, 10.3, 34.4, 11.4, 33.2, 13.2, 32.9, 15.3, 32.3, 17.5, 31, 19.5, 30.4, 20.1, 32, 21.8, 32.8, 23.3, 32.3, 25.2, 31.6, 27.6, 31.4, 29.9, 31.2, 31.6, 31.5, 32.4, 31.2, 34.2, 31.3, 34.9, 29.5, 34.4, 27.9, 33.6, 28.1, 32.6, 29.9, 33.8, 27.2, 35.6, 23.9, 37.3, 21, 37.2, 19.6, 38.6, 17.9, 39.6, 15.6, 41.2, 13.9, 43.3, 11.6, 44.6, 10.4, 47.4, 11.2, 51.2, 11.8, 51, 10.4, 49.8, 7.9, 47.9, 4.8, 45.3, 2, 43.2, 0.3, 41.6, -1.6, 39.7, -4, 39.2, -6.8, 39.5, -9.3, 40.4, -10.5, 40.6, -15, 39.4, -16.8, 36.8, -18, 34.8, -19.8, 35.4, -22, 35.5, -24, 32.9, -25.6, 32.7, -26.8, 32.4, -28.6, 31, -29.9, 28.1, -32.7, 25.6, -34, 22.5, -34, 20, -34.8, 18.4, -34.2, 18.1, -32.5, 17.9, -31, 16.5, -28.6, 15.2, -27, 14.5, -22.9, 13.4, -20.8, 11.8, -17.3, 11.8, -15.8, 12.6, -13.2, 13.2, -8.8, 12.3, -6.1, 11.8, -4.7, 10.6, -3.4, 9.3, -0.7, 9.4, 0.4, 9.8, 3, 9.5, 4, 8.5, 4.5, 7, 4.4, 5.6, 4.3, 4.6, 6, 3.4, 6.4, 1.2, 6, -0.2, 5.6, -2, 4.8, -4, 5.3, -5.9, 5, -7.5, 4.4, -9.4, 5.4, -10.8, 6.3, -12.5, 7.6, -13.2, 8.5, -14.6, 10.3, -15.5, 11.6, -16.7, 12.4, -17.4, 14.7, -16.5, 16.2, -16.3, 19.5, -17, 21, -16.3, 22.8, -14.8, 24.9, -13.3, 27.6, -11.4, 28.4, -9.8, 29.8, -9.6, 30.4, -9.8, 31.5, -8.6, 33.3, -7.6, 33.6, -6.8, 34, -5.9, 35.8],
  // Madagascar
  [49.3, -12, 50.4, -15.5, 49.7, -17.3, 48.8, -20.3, 47.6, -24.4, 47.1, -24.9, 45.2, -25.6, 43.8, -24.4, 43.3, -22, 44, -20, 44.3, -17.4, 44.4, -16.2, 46.3, -15.7, 47.9, -13.6, 49.3, -12],
  // Great Britain & Ireland & Iceland
  [-5.7, 50.1, -3.4, 50.6, 0.3, 50.8, 1.4, 51.2, 1.7, 52.7, 0.3, 53.4, -0.1, 54.5, -1.6, 55.6, -2.1, 56.9, -1.8, 57.6, -4, 57.6, -3, 58.6, -5, 58.6, -5.8, 57.1, -5.6, 55.4, -4.9, 54.9, -3.2, 54.6, -3, 53.4, -4.6, 53.3, -4.2, 52.2, -5.3, 51.8, -3, 51.5, -4.2, 51.1, -5.7, 50.1],
  [-6, 52.2, -6.1, 53.4, -5.6, 54.6, -7.3, 55.3, -8.5, 54.3, -10, 53.5, -9.9, 51.7, -8, 51.6, -6, 52.2],
  [-22.5, 64, -24, 65.5, -22, 66.4, -16.5, 66.5, -13.5, 65.2, -15, 64.2, -18.5, 63.4, -22.5, 64],
  // Mediterranean islands
  [12.4, 38.1, 15.6, 38.3, 15.1, 36.7, 12.4, 37.6, 12.4, 38.1],
  [8.2, 41, 9.8, 41.1, 9.6, 39.1, 8.4, 38.9, 8.2, 41],
  [8.6, 42.9, 9.5, 43, 9.4, 41.4, 8.6, 41.6, 8.6, 42.9],
  [23.5, 35.3, 26.3, 35.3, 26.2, 34.9, 23.6, 35, 23.5, 35.3],
  [32.3, 35, 34.6, 35.6, 34, 34.6, 32.3, 34.7, 32.3, 35],
  // Japan, Taiwan, Hainan, Sri Lanka, Sakhalin
  [140, 41.5, 141.5, 45.4, 145.5, 43.3, 143.2, 42, 140, 41.5],
  [130.9, 34, 132.5, 35.4, 135, 35.7, 136.5, 37.3, 139, 38, 140, 40, 140.9, 41.5, 141.5, 40.5, 141.9, 39, 141, 37, 140.8, 35.7, 139.8, 35, 138.8, 34.6, 136.8, 34.3, 135.1, 33.5, 133, 34.3, 130.9, 34],
  [129.6, 33.4, 131.7, 33.6, 131.5, 31.4, 130.2, 31.2, 129.6, 33.4],
  [132.5, 33, 134.7, 34.2, 134.3, 33.3, 132.5, 33],
  [120.1, 23, 121.5, 25.3, 121.9, 24.5, 120.8, 22, 120.1, 23],
  [108.6, 19.2, 110.5, 20.1, 111, 19.6, 109.5, 18.2, 108.6, 19.2],
  [79.8, 8, 80.2, 9.8, 81.9, 7.5, 80.6, 5.9, 79.8, 8],
  [142, 46, 143.5, 49, 142.8, 54.3, 142.2, 51, 142, 46],
  // the Indonesian islands and the Philippines
  [95.3, 5.6, 97.5, 5.2, 100, 2.5, 103.5, -0.5, 106, -3, 105.8, -5.8, 104.5, -5.9, 102.3, -4, 100.4, -1, 98.5, 1.7, 95.3, 5.6],
  [105.2, -6.8, 106, -5.9, 108.5, -6.5, 111, -6.4, 112.7, -6.9, 114.4, -7.7, 114.5, -8.7, 112, -8.3, 108, -7.8, 105.2, -6.8],
  [114.4, -8.1, 115.2, -8.05, 115.7, -8.4, 115.1, -8.85, 114.5, -8.5, 114.4, -8.1],
  [116, -8.2, 117, -8.2, 119.5, -8.4, 122, -8.2, 123, -8.5, 120, -8.9, 117, -8.8, 116, -8.2],
  [109, 1.5, 109.5, -1, 110.3, -3, 114.5, -4, 116.2, -2.5, 117.8, 0.8, 119, 5, 117.5, 6.9, 116, 6, 113.5, 3.5, 111, 2, 109, 1.5],
  [119.4, -5.5, 120.5, -2.5, 120.8, 1.3, 124.9, 1.6, 121.5, 0.5, 121, -1, 123.3, -0.9, 122, -4.6, 120.4, -5.6, 119.4, -5.5],
  [131, -1, 134, -0.9, 138, -1.6, 141, -2.6, 145.8, -4.5, 147.5, -6, 150.7, -10.5, 147, -10, 143.5, -9, 141, -9.1, 138, -8, 137.5, -5, 134.5, -4, 132, -2.8, 131, -1],
  [120, 18.5, 122.3, 18.4, 122, 16, 124, 13, 121, 13.8, 120.5, 14.5, 120, 16.5, 120, 18.5],
  [122, 7, 126.5, 7, 125.5, 9.8, 123.5, 8.6, 122, 7],
  // Australia & New Zealand
  [113.5, -22, 114.2, -26, 115, -29.5, 115, -33.6, 118, -35, 124, -33.8, 130, -31.5, 135.5, -34.8, 138.5, -35, 140, -38, 144.9, -38.2, 146.4, -39.1, 150, -37.5, 151.2, -33.9, 153.6, -28.2, 153.2, -27.5, 150.8, -23, 146, -18.9, 145.8, -16.9, 142.5, -10.7, 141.6, -12.9, 141.5, -17, 139.5, -17.5, 136.5, -15.5, 136.9, -12.3, 132.5, -11.5, 130.8, -12.4, 129, -15, 125.2, -14.5, 122.2, -18, 119, -20.2, 116.5, -20.6, 113.5, -22],
  [172.7, -34.5, 175, -36.8, 178.5, -37.7, 177, -39.3, 175.2, -41.6, 174.6, -39.5, 172.7, -34.5],
  [172.7, -40.5, 174.3, -41.5, 173, -43.5, 171, -45, 168.4, -46.6, 166.5, -45.8, 168, -44, 170.5, -42.8, 172.7, -40.5],
  // the Caribbean
  [-85, 21.8, -82, 23.1, -77.5, 21.8, -74.2, 20.2, -77.5, 19.9, -81, 21.6, -85, 21.8],
  [-74.4, 18.5, -72.8, 19.9, -69.8, 19.6, -68.4, 18.6, -71, 18, -74.4, 18.5],
  // Antarctica
  [-180, -90, 180, -90, 180, -71, 150, -68.5, 120, -66.5, 90, -66.5, 60, -67, 30, -69.5, 0, -70, -30, -76, -55, -71, -58, -64, -62, -63.5, -64, -66, -75, -72.5, -100, -74, -140, -76, -180, -78, -180, -90]
];
// lakes and inland seas painted back as water
const TOUR_WATER = [
  [27.5, 42.4, 28, 43.8, 29.7, 45.3, 30.8, 46.5, 33, 45.9, 32.5, 45.3, 33.6, 44.4, 35, 44.8, 36.6, 45.2, 37.8, 44.7, 39.5, 43.5, 41.6, 41.6, 39.5, 41, 36, 41.7, 33, 42, 31, 41.2, 29, 41.2, 27.5, 42.4],
  [47, 44.5, 48.5, 46.5, 51.5, 47, 53, 45, 51, 44.5, 52.8, 41.5, 54, 39.5, 53.9, 37.3, 50.5, 37, 49, 38, 49.5, 40.3, 47.6, 42.5, 47, 44.5]
];

const TourMap = {
  pinR: 11,
  paths: null,
  build() {
    if (this.paths || typeof Path2D === 'undefined') return;
    const mk = ring => { const p = new Path2D(); for (let i = 0; i < ring.length; i += 2) { if (i) p.lineTo(ring[i], -ring[i + 1]); else p.moveTo(ring[i], -ring[i + 1]); } p.closePath(); return p; };
    this.paths = { land: TOUR_LAND.map(mk), water: TOUR_WATER.map(mk) };
  },
  // the tour route between consecutive main stops
  legs() {
    const main = TOUR_ROUTE.filter(s => !s.secret), out = [];
    for (let i = 0; i + 1 < main.length; i++) out.push([main[i], main[i + 1]]);
    return out;
  },
  stopState(s) {
    const C = Tour.countries[s.id];
    if (!C) return s.secret ? 'hidden' : 'soon';
    if (s.secret && !TourProgress.countryUnlocked(C)) return 'hidden';
    if (!TourProgress.countryUnlocked(C)) return 'locked';
    return TourProgress.countryDone(C) ? 'done' : 'open';
  },
  // the lands Brady can fly to, in route order (secret lands once found)
  destinations() { return TOUR_ROUTE.filter(s => { const st = this.stopState(s); return st === 'open' || st === 'done'; }); },
  // a reveal that plays on the world route map (the others play in their land's overworld)
  routeKind(r) { return r.kind === 'land' || r.kind === 'flight' || (r.kind === 'house' && !r.cc); }
};

// M opens the route map from the overworld (Input has no key for it)
// M opens the route map; Enter is latched here too (a quick tap can come and go between two updates)
const TourMapKeys = { m: false, enter: false };
try { window.addEventListener('keydown', e => { if (e.repeat) return; if (e.code === 'KeyM') TourMapKeys.m = true; if (e.code === 'Enter' || e.code === 'NumpadEnter') TourMapKeys.enter = true; }); } catch (e) { /* not in a browser */ }

/* ============================================================
   The map scene. Two modes:
   - 'land': the walkable overworld of one land (28_tour_fd_overworld.js): Brady walks the trails between level
     stops with the joystick or the arrow keys, a tap walks him to a stop, jump / Enter goes in.
   - 'route': the world route map: pins on the globe, the Baron's airship, the lighthouse, secret flights. Pick a
     land (left / right or a tap) and fly there; landing puts Brady on that land's airstrip.
   Opened after a level with { from: id }: Brady stands on that level's stop, the reveal queue plays, then he walks
   on to whatever the exit opened.
   ============================================================ */
class TourMapScene {
  constructor(opts) {
    opts = opts || {};
    this.t = 0; this.toastT = 0; this.toastMsg = '';
    TourMap.build();
    const T = TourProgress.data(), mains = Tour.mainCountries();
    // where Brady is: the land of the level he just left, the last land, or the first stop
    let fromC = null, fromKey = null;
    const from = opts.from ? String(opts.from) : null;
    if (from && from.indexOf('house:') === 0) { const h = Tour.house(from.slice(6)); if (h) { fromC = h.C; fromKey = from; } }
    else if (from) { fromC = Tour.countryOf(from); if (fromC && Tour.specOf(from)) fromKey = from; else fromC = null; }
    const at = fromC ? fromC.id : (T.at && Tour.countries[T.at] ? T.at : (mains[0] ? mains[0].id : 'mx'));
    this.sel = at;
    const s0 = Tour.stops[at];
    this.plane = { lon: s0.lon, lat: s0.lat, ang: 0 };
    this.flight = null; this.rRevealQ = null; this.rReveal = null;
    this.cam = { lon: s0.lon, lat: s0.lat, z: 5 };
    // the exit Brady just took (consumed once): where to walk, or which land to fly to
    const LE = T.lastExit; T.lastExit = null;
    const fresh = LE && fromKey && LE.id === fromKey ? LE : null;
    let auto = null; this.flyAfter = null;
    if (fresh && fromC) {
      if (fresh.id.indexOf('house:') === 0) auto = null;
      else {
        const L = Tour.specOf(fresh.id), ex = L && L.exits[fresh.key], tg = ex ? Tour.target(ex.to, fromC) : null;
        if (tg && (tg.kind === 'level' || tg.kind === 'node') && Tour.countryOf(tg.id) === fromC) auto = tg.id;
        else if (tg && tg.kind === 'house' && tg.cc === fromC.id) auto = 'house:' + tg.id;
        else if (tg && tg.kind === 'country') auto = 'port';
        else if (tg && (tg.kind === 'land' || tg.kind === 'flight') && Tour.countries[tg.id] && TourProgress.countryUnlocked(Tour.countries[tg.id]) && !T.seen[tg.id]) this.flyAfter = tg.id;
      }
    }
    const arrive = !T.seen[at];
    T.seen[at] = true; T.at = at;
    this.music();
    this.mode = 'land';
    this.ow = new TourOverworld(this, Tour.countries[at] || mains[0], { at: fromKey, auto, arrive });
    // the very first visit: Chinka's first postcard
    const C0 = Tour.countries[this.sel];
    if (!T.cards) T.cards = {};
    if (C0 && !T.cards[C0.id]) { T.cards[C0.id] = true; this.card = tourArrivalCard(C0); Save.save(); }
    if (opts.route) this.openRoute({ dest: this.sel });
    this.build();
  }
  music() { const C = Tour.countries[this.sel]; Sound.music((C && C.music.map) || ((Sound.trackNames || []).indexOf('tour_map') >= 0 ? 'tour_map' : 'map')); }
  // back from the settings screen
  resume() { this.build(); return this; }
  resize() { this.build(); }
  get reveal() { return this.mode === 'land' ? (this.ow && this.ow.reveal) || null : this.rReveal; }
  get walker() { return this.ow ? this.ow.walker : null; }
  build() {
    const W = Game.cssW, H = Game.cssH;
    const side = Math.max(12, insets.l + 6), top = Math.max(10, insets.t + 4);
    this.portrait = H > W * 1.05;
    this.mapR = { x: 0, y: 0, w: W, h: H };
    this.cam.z = this.portrait ? clamp(W / 90, 3.4, 4.6) : clamp(Math.min(W / 120, H / 62), 3.6, 6.5);
    this.backBtn = { x: side, y: top, w: 84, h: 34, label: '◀ MENU', size: 11, fn: () => { Sound.play('back'); this.leave(new TitleScene()); } };
    if (this.ow) this.ow.layoutView();
    this.layoutRoute();
  }
  // every way out of the map scene: touch controls back to normal first
  leave(scene) { Input.hud = null; Input.camDrag = false; Game.setScene(scene); }
  toast(m) { this.toastMsg = m; this.toastT = 2.2; }
  prevName(id) { const C = Tour.countries[id], P = C && Tour.prevCountry(C); return P ? P.name.toUpperCase() : 'THE LAST COUNTRY'; }
  // legacy entry point: play level i of the current land
  play(i) {
    const C = Tour.countries[this.sel]; if (!C) return;
    const id = C.world + '-' + i;
    if (!TourProgress.isUnlocked(id)) { Sound.play('bump', { vol: 0.5 }); this.toast('LOCKED: FINISH THE LEVEL BEFORE IT'); return; }
    this.startLevel(id);
  }
  startLevel(id) {
    const C = Tour.countryOf(id); if (!C) return;
    Sound.play('select'); const T = TourProgress.data(); T.at = C.id; (T.panelAt = T.panelAt || {})[C.id] = id; Save.save();
    const [w, i] = id.split('-').map(Number);
    this.leave(new Play(getLevel(w, i), {}));
  }
  startHouse(hid) {
    const lvl = Tour.houseLevel(hid); if (!lvl) return;
    const h = Tour.house(hid); Sound.play('select'); const T = TourProgress.data(); T.at = h.C.id; (T.panelAt = T.panelAt || {})[h.C.id] = 'house:' + hid; Save.save();
    this.leave(new Play(lvl, {}));
  }

  /* ---------- the world route map ---------- */
  openRoute(o) {
    o = o || {};
    this.mode = 'route'; Input.setMode('ui'); Input.hud = null; Input.camDrag = false;
    const list = TourMap.destinations();
    this.dest = o.dest && list.some(s => s.id === o.dest) ? o.dest : this.sel;
    const st = Tour.stops[this.sel]; this.plane.lon = st.lon; this.plane.lat = st.lat;
    const d = Tour.stops[this.dest]; this.cam.lon = (st.lon + d.lon) / 2; this.cam.lat = clamp((st.lat + d.lat) / 2, -40, 55);
    this.rRevealQ = null; this.routeBeat = 0;
    Sound.play('map_open', { vol: 0.6 });
    this.layoutRoute();
  }
  // back to walking the current land
  closeRoute() {
    this.mode = 'land'; this.flight = null; this.rReveal = null;
    if (!this.ow || this.ow.C.id !== this.sel) this.ow = new TourOverworld(this, Tour.countries[this.sel], { at: 'start' });
    this.ow.layoutView(); this.music();
  }
  layoutRoute() {
    const W = Game.cssW, H = Game.cssH, bot = Math.max(10, insets.b + 6), side = Math.max(12, insets.l + 6, insets.r + 6);
    const cw = Math.min(W - side * 2, 460), ch = 64, x = (W - cw) / 2, y = H - bot - ch;
    this.destCard = { x, y, w: cw, h: ch };
    const bh = 44;
    this.routeBtns = {
      prev: { x: x + 6, y: y + (ch - bh) / 2, w: 44, h: bh },
      next: { x: x + cw - 50 - 112, y: y + (ch - bh) / 2, w: 44, h: bh },
      fly: { x: x + cw - 112, y: y + (ch - bh) / 2, w: 106, h: bh },
      back: { x: W - side - 96, y: Math.max(10, insets.t + 4), w: 96, h: 34 }
    };
  }
  sx(lon) { return this.mapR.x + this.mapR.w / 2 + (lon - this.cam.lon) * this.cam.z; }
  sy(lat) { return this.mapR.y + this.mapR.h / 2 - (lat - this.cam.lat) * this.cam.z; }
  flyTo(id, auto) {
    const s = Tour.stops[id]; if (!s) return;
    if (this.mode !== 'route') this.openRoute({ dest: id });
    const from = { lon: this.plane.lon, lat: this.plane.lat };
    const dist = Math.hypot(s.lon - from.lon, s.lat - from.lat);
    this.dest = id;
    if (dist < 0.5) { this.land(id); return; }
    this.flight = { from, to: { lon: s.lon, lat: s.lat }, k: 0, dur: clamp(dist / 28, 1.4, 3.4), id, auto };
    TourKit.sfx('plane', 'fly', { vol: 0.6 });
  }
  // the plane touches down: walk this land from its airstrip
  land(id) {
    const T = TourProgress.data(), C = Tour.countries[id];
    this.flight = null; if (!C) return;
    const first = !T.seen[id];
    if (first) { T.seen[id] = true; this.toast('WELCOME TO ' + C.name.toUpperCase() + '!'); Sound.play('checkpoint'); }
    T.at = id; this.sel = id;
    if (!(T.cards = T.cards || {})[id]) { T.cards[id] = true; this.card = tourArrivalCard(C); }
    (T.panelAt = T.panelAt || {})[id] = 'start';
    Save.save();
    this.mode = 'land'; this.rReveal = null;
    this.ow = new TourOverworld(this, C, { at: 'start', arrive: first, landing: true });
    this.ow.layoutView(); this.music();
  }
  // select a land on the route map (a second tap on the same pin flies)
  pick(id, fromTap) {
    const s = Tour.stops[id], st = TourMap.stopState(s);
    if (st === 'hidden') return false;
    if (st === 'soon') { this.toast(s.name.toUpperCase() + ': COMING SOON'); Sound.play('bump', { vol: 0.4 }); return true; }
    if (st === 'locked') { this.toast('FINISH ' + this.prevName(id) + ' FIRST'); Sound.play('bump', { vol: 0.4 }); return true; }
    if (fromTap && this.dest === id) { this.go(); return true; }
    this.dest = id; Sound.play('select', { vol: 0.5 }); return true;
  }
  go() { if (this.flight || this.rReveal) return; if (this.dest === this.sel && Math.hypot(this.plane.lon - Tour.stops[this.sel].lon, this.plane.lat - Tour.stops[this.sel].lat) < 0.5) { Sound.play('select'); this.closeRoute(); return; } this.flyTo(this.dest); }
  cycle(d) {
    const list = TourMap.destinations(); if (!list.length) return;
    const i = Math.max(0, list.findIndex(s => s.id === this.dest));
    this.dest = list[(i + d + list.length) % list.length].id; Sound.play('select', { vol: 0.4 });
  }

  /* ---------- route-map reveals: a new land, a secret flight, the lighthouse ---------- */
  startRouteReveals() {
    const T = TourProgress.data();
    this.rRevealQ = T.pending.filter(r => TourMap.routeKind(r));
    this.nextRouteReveal();
  }
  nextRouteReveal() {
    const r = this.rRevealQ && this.rRevealQ.shift();
    if (!r) { this.rReveal = null; return; }
    const calm = TourKit.reduceMotion();
    const banner = r.kind === 'land' ? 'NEW LAND!' : r.kind === 'flight' ? 'SECRET FLIGHT!' : 'POSTCARD LIGHTHOUSE!';
    this.rReveal = { r, t: 0, k: 0, dur: calm ? 0.3 : 2.4, calm, banner, sparks: [] };
    const where = r.kind === 'land' ? Tour.stops[r.id] : r.kind === 'flight' ? Tour.stops[r.to] : { lon: TOUR_LIGHTHOUSE.lon, lat: TOUR_LIGHTHOUSE.lat };
    if (where) this.rReveal.focus = { lon: where.lon, lat: where.lat };
    TourKit.sfx('newland', 'checkpoint');
  }
  updateRouteReveal(dt) {
    const R = this.rReveal; if (!R) return;
    R.t += dt; R.k = R.calm ? R.t / R.dur : R.t;
    if (R.t >= R.dur) { TourProgress.revealDone(R.r); Save.save(); this.nextRouteReveal(); }
  }

  update(dt) {
    this.t += dt; if (this.toastT > 0) this.toastT -= dt;
    this.updateWorldFx(dt);
    if (this.mode === 'land') return this.updateLand(dt);
    return this.updateRoute(dt);
  }
  updateLand(dt) {
    const ow = this.ow;
    if (Input.mode !== 'game' && !ow.menu) Input.setMode('game');
    Input.camDrag = !ow.menu; this.setHud();
    const inp = ow.readInput();
    // Chinka's postcard: any tap or key puts it away
    if (this.card) { ow.update(dt, null); if (inp.taps.length || inp.enter || inp.back) { this.card = null; Sound.play('cardFlip'); } TourMapKeys.m = false; return; }
    if (TourMapKeys.m && ow.idle()) { TourMapKeys.m = false; this.openRoute({ dest: this.sel }); return; }
    TourMapKeys.m = false;
    ow.update(dt, inp);
    // once the land's own reveals are done: the world map's reveals (a new land, a secret flight, the lighthouse)
    if (ow.idle() && !this.routeChecked) {
      this.routeChecked = true;
      if (TourProgress.data().pending.some(r => TourMap.routeKind(r)) || this.flyAfter) { this.openRoute({ dest: this.flyAfter || this.sel }); this.startRouteReveals(); this.routeReturn = !this.flyAfter; }
    }
  }
  // the world and menu buttons sit next to the pause spot of the touch layout
  setHud() {
    const L = Input.layout; if (!L) { Input.hud = null; return; }
    const p = L.pause, dx = L.lefty ? 50 : -50;
    this.hudBtns = { menu: { x: p.x, y: p.y, r: 20 }, world: { x: p.x + dx, y: p.y, r: 20 } };
    Input.hud = this.ow && this.ow.menu ? null : [{ id: 'world', x: p.x + dx, y: p.y, r: 20 }];
  }
  updateRoute(dt) {
    const T = TourProgress.data();
    if (this.rRevealQ == null && !this.flight) this.startRouteReveals();
    if (this.rReveal) { this.updateRouteReveal(dt); if (Input.taps.length && this.rReveal && this.rReveal.t > 0.2) this.rReveal.t = Math.max(this.rReveal.t, this.rReveal.dur - 0.15); Input.taps.length = 0; Input.uiKey = null; }
    else if (this.rRevealQ && !this.rRevealQ.length && !this.flight && this.routeBeat >= 0) {
      // the reveals are over: fly to a land the exit opened, or go back to walking
      if (this.flyAfter) { const id = this.flyAfter; this.flyAfter = null; this.flyTo(id, true); }
      else if (this.routeReturn) { this.routeBeat += dt; if (this.routeBeat > 0.5) { this.routeReturn = false; this.closeRoute(); return; } }
    }
    // the flight
    if (this.flight) {
      const f = this.flight; f.k = Math.min(1, f.k + dt / f.dur);
      const e = easeInOut(f.k), mid = { lon: (f.from.lon + f.to.lon) / 2, lat: (f.from.lat + f.to.lat) / 2 + Math.hypot(f.to.lon - f.from.lon, f.to.lat - f.from.lat) * 0.25 };
      const q = (a, b, c, k) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * b + k * k * c;
      const nl = q(f.from.lon, mid.lon, f.to.lon, e), nt = q(f.from.lat, mid.lat, f.to.lat, e);
      this.plane.ang = Math.atan2(-(nt - this.plane.lat), nl - this.plane.lon || 0.0001);
      this.plane.lon = nl; this.plane.lat = nt;
      if (f.k >= 1) { this.land(f.id); return; }
    }
    this.routeInput();
    if (this.mode === 'route') this.routeCam(dt);
  }
  // the camera follows the plane while flying, a reveal, or the leg to the chosen land
  routeCam(dt) {
    const R = this.rReveal, ds = Tour.stops[this.dest] || Tour.stops[this.sel];
    const tgt = this.flight ? this.plane : R && R.focus ? R.focus : { lon: (ds.lon + this.plane.lon) / 2, lat: (ds.lat + this.plane.lat) / 2 };
    this.cam.lon = lerp(this.cam.lon, tgt.lon, 1 - Math.exp(-dt * 3));
    this.cam.lat = lerp(this.cam.lat, clamp(tgt.lat, -40, 55), 1 - Math.exp(-dt * 3));
  }
  routeInput() {
    if (this.card) { if (Input.taps.length || Input.uiKey === 'enter' || Input.jumpPressed) { this.card = null; Sound.play('cardFlip'); } return; }
    if (this.flight || this.rReveal) return;
    // the lighthouse and the ghost pins answer taps first
    if (this.routeTapExtras()) return;
    const B = this.routeBtns, hit = (b, tp) => tp.x >= b.x - 4 && tp.x <= b.x + b.w + 4 && tp.y >= b.y - 4 && tp.y <= b.y + b.h + 4;
    for (const tp of Input.taps) {
      if (hit(this.backBtn, tp)) { this.backBtn.fn(); return; }
      if (hit(B.back, tp)) { Sound.play('back'); this.closeRoute(); return; }
      if (hit(B.prev, tp)) { this.cycle(-1); return; }
      if (hit(B.next, tp)) { this.cycle(1); return; }
      if (hit(B.fly, tp)) { this.go(); return; }
      let best = null, bd = 28;
      for (const s of TOUR_ROUTE) { const d = Math.hypot(tp.x - this.sx(s.lon), tp.y - this.sy(s.lat)); if (d < bd && TourMap.stopState(s) !== 'hidden') { bd = d; best = s; } }
      if (best) { this.pick(best.id, true); return; }
    }
    const k = Input.uiKey;
    if (k === 'left' || k === 'up') this.cycle(-1);
    if (k === 'right' || k === 'down') this.cycle(1);
    if (k === 'enter' || Input.jumpPressed || TourMapKeys.enter) { TourMapKeys.enter = false; this.go(); return; }
    if (k === 'back' || Input.pausePressed || TourMapKeys.m) { TourMapKeys.m = false; Sound.play('back'); this.closeRoute(); }
  }

  draw(ctx) {
    if (this.mode === 'land') { this.ow.draw(ctx); this.drawOverlays(ctx); return; }
    this.drawRoute(ctx);
    this.drawOverlays(ctx);
  }
  drawOverlays(ctx) {
    const W = Game.cssW, H = Game.cssH;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    if (this.card) this.drawCard(ctx);
    if (this.toastT > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, this.toastT * 2); ctx.font = `12px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const tw = Math.min(W - 24, ctx.measureText(this.toastMsg).width + 30), cx = W / 2, cy = this.mode === 'land' && this.ow ? this.ow.toastY() : H * 0.22;
      ctx.fillStyle = 'rgba(10,8,24,0.82)'; rr(ctx, cx - tw / 2, cy - 15, tw, 30, 15); ctx.fill();
      ctx.fillStyle = '#ffd84a'; ctx.fillText(this.toastMsg, cx, cy + 1, tw - 20); ctx.restore();
    }
  }
  drawRoute(ctx) {
    const W = Game.cssW, H = Game.cssH, R = this.mapR, z = this.cam.z, t = this.t;
    ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
    ctx.save();
    const og = ctx.createLinearGradient(0, 0, 0, H); og.addColorStop(0, '#1d6fc4'); og.addColorStop(1, '#0c3d86');
    ctx.fillStyle = og; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) { const x = this.sx(lon); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let lat = -60; lat <= 80; lat += 30) { const y = this.sy(lat); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 26; i++) { const lon = ((i * 47) % 360) - 180, lat = ((i * 29) % 120) - 50; const x = this.sx(lon) + Math.sin(t + i) * 3, y = this.sy(lat); ctx.beginPath(); ctx.arc(x, y, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.beginPath(); ctx.arc(x + 10, y, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    if (TourMap.paths) {
      ctx.save();
      ctx.translate(this.sx(0), this.sy(0)); ctx.scale(z, z);
      ctx.save(); ctx.translate(0.5, 0.7); ctx.fillStyle = 'rgba(0,20,60,0.35)'; for (const p of TourMap.paths.land) ctx.fill(p); ctx.restore();
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#f2dca0'; ctx.lineWidth = 2.2 / z * 1.6; for (const p of TourMap.paths.land) ctx.stroke(p);
      const lg = ctx.createLinearGradient(0, -75, 0, 60); lg.addColorStop(0, '#9ad08a'); lg.addColorStop(0.45, '#6ab85a'); lg.addColorStop(0.7, '#c8b06a'); lg.addColorStop(1, '#e8f0f8');
      ctx.fillStyle = lg; for (const p of TourMap.paths.land) ctx.fill(p);
      ctx.fillStyle = '#2a7ad0'; for (const p of TourMap.paths.water) ctx.fill(p);
      ctx.restore();
    }
    for (const [a, b] of TourMap.legs()) {
      const sa = TourMap.stopState(a), sb = TourMap.stopState(b), flown = (sa === 'done' || sa === 'open') && (sb === 'done' || sb === 'open');
      this.arc(ctx, a, b, flown ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', flown ? 0 : t * 12);
    }
    this.drawWorldFx(ctx, 'under');
    // the leg to the chosen land
    if (!this.flight && this.dest && this.dest !== this.sel) this.arc(ctx, Tour.stops[this.sel], Tour.stops[this.dest], 'rgba(255,216,74,0.95)', t * 30);
    for (const s of TOUR_ROUTE) this.drawStop(ctx, s);
    this.drawPlane(ctx, this.sx(this.plane.lon), this.sy(this.plane.lat), this.flight ? this.plane.ang : Math.sin(t * 2) * 0.1);
    this.drawWorldFx(ctx, 'over');
    ctx.restore();
    // title, totals, buttons, the destination card
    UI.drawButton(ctx, this.backBtn, false);
    ctx.save(); ctx.font = `14px ${FONT_DISPLAY}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 6;
    const tot = TourProgress.totals(), tx = this.backBtn.x + this.backBtn.w + 12;
    ctx.fillText('WORLD TOUR', tx, this.backBtn.y + 12);
    ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(`${tot.done}/${tot.total} levels  ·  ${tot.gold}/${tot.goldTotal} postcards`, tx, this.backBtn.y + 28);
    const W22 = Tour.countries.w22;
    if (W22 && !TourProgress.countryUnlocked(W22)) { ctx.font = `italic 11px ${FONT_UI}`; ctx.fillStyle = `rgba(255,236,170,${0.85 + 0.15 * Math.sin(this.t * 1.5)})`; ctx.fillText('Legend speaks of a World 22…', tx, this.backBtn.y + 43); }
    ctx.restore();
    if (!this.flight) this.drawDestCard(ctx);
    const RV = this.rReveal; if (RV && RV.banner && RV.t > 0.3) TourPanelFx.banner(ctx, RV.banner, W / 2, H * 0.32, clamp((RV.t - 0.3) / 0.25, 0, 1), RV.dur - RV.t);
    ctx.restore();
  }
  drawDestCard(ctx) {
    const R = this.destCard, B = this.routeBtns, s = Tour.stops[this.dest] || Tour.stops[this.sel], C = Tour.countries[s.id];
    const cols = C ? C.colors : { a: '#8a8aa8', b: '#5a5a78', c: '#c8c8d8' };
    ctx.save();
    UI.drawButton(ctx, Object.assign({ label: '◀ ' + ((Tour.stops[this.sel] || {}).name || '').toUpperCase().slice(0, 10), size: 10 }, B.back), false);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; ctx.fillStyle = 'rgba(16,12,32,0.92)'; rr(ctx, R.x, R.y, R.w, R.h, 16); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(cols.a, 0.8); ctx.lineWidth = 1.5; rr(ctx, R.x, R.y, R.w, R.h, 16); ctx.stroke();
    const arrow = (b, d) => { ctx.fillStyle = 'rgba(255,255,255,0.1)'; rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); const cx = b.x + b.w / 2, cy = b.y + b.h / 2; ctx.moveTo(cx + d * 7, cy); ctx.lineTo(cx - d * 5, cy - 8); ctx.lineTo(cx - d * 5, cy + 8); ctx.closePath(); ctx.fill(); };
    arrow(B.prev, -1); arrow(B.next, 1);
    const here = this.dest === this.sel;
    UI.drawButton(ctx, Object.assign({ label: here ? 'WALK ▶' : 'FLY ✈', primary: true, size: 13 }, B.fly), !Input.usingTouch);
    const tx = B.prev.x + B.prev.w + 10, tw = B.next.x - tx - 8;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.font = `${Math.min(16, tw / 8)}px ${FONT_DISPLAY}`;
    ctx.fillText(TourLandscape.fit(ctx, s.name.toUpperCase(), tw), tx, R.y + 22);
    ctx.font = `11px ${FONT_UI}`; ctx.fillStyle = 'rgba(255,255,255,0.72)';
    let sub = C ? (C.tagline || s.sub || '') : (s.sub || '');
    if (C) { let d = 0, n = 0, g = 0; for (const id of Tour.levelIds(C)) { const L = Tour.specOf(id); if (L.secret && !TourProgress.isRevealed(id)) continue; n++; if (Save.data.done[id]) d++; g += TourProgress.goldCount(id); } sub = `${d}/${n} levels · ${g} postcards` + (here ? ' · you are here' : ''); }
    ctx.fillText(TourLandscape.fit(ctx, sub, tw), tx, R.y + 44);
    ctx.restore();
  }
  // a postcard from Chinka, laid over the map
  drawCard(ctx) {
    const W = Game.cssW, H = Game.cssH, C = Tour.countries[this.sel] || {}, cols = C.colors || { a: '#ff4f8a', b: '#38c8ff', c: '#ffd84a' };
    ctx.save(); ctx.fillStyle = 'rgba(6,10,30,0.55)'; ctx.fillRect(0, 0, W, H);
    const cw = Math.min(W - 40, 460), ch = Math.min(H - 60, 230), x = (W - cw) / 2, y = (H - ch) / 2;
    ctx.translate(W / 2, H / 2); ctx.rotate(-0.02 + Math.sin(this.t * 1.5) * 0.008); ctx.translate(-W / 2, -H / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.fillStyle = '#fffaf0'; rr(ctx, x, y, cw, ch, 6); ctx.fill(); ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, cols.b); g.addColorStop(1, cols.c);
    ctx.fillStyle = g; ctx.fillRect(x + 12, y + 12, cw * 0.36, ch - 24);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = `${Math.min(18, cw / 18)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((C.name || '').toUpperCase(), x + 12 + cw * 0.18, y + ch * 0.5, cw * 0.34);
    ctx.fillStyle = cols.a; ctx.fillRect(x + cw - 52, y + 14, 38, 44);
    ctx.strokeStyle = '#ffffff'; ctx.setLineDash([2, 2]); ctx.strokeRect(x + cw - 49, y + 17, 32, 38); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(60,40,80,0.25)'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + cw * 0.42, y + 76 + k * 26); ctx.lineTo(x + cw - 18, y + 76 + k * 26); ctx.stroke(); }
    ctx.fillStyle = '#3a2a5a'; ctx.font = `10px ${FONT_DISPLAY}`; ctx.textAlign = 'left'; ctx.fillText(this.card.title, x + cw * 0.42, y + 34, cw * 0.4);
    ctx.font = `italic ${Math.min(14, cw / 30)}px ${FONT_UI}`; ctx.fillStyle = '#2a2a4a'; ctx.textAlign = 'center';
    tourWrapText(ctx, this.card.text, x + cw * 0.42 + (cw * 0.58 - 18) / 2, y + ch * 0.58, cw * 0.55 - 18, 19);
    ctx.font = `9px ${FONT_DISPLAY}`; ctx.fillStyle = 'rgba(60,40,90,0.7)'; ctx.fillText('TAP TO CONTINUE', x + cw * 0.7, y + ch - 14);
    ctx.restore();
  }
  arc(ctx, a, b, col, dash) {
    const x0 = this.sx(a.lon), y0 = this.sy(a.lat), x1 = this.sx(b.lon), y1 = this.sy(b.lat);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * 0.25;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([5, 6]); ctx.lineDashOffset = -dash;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(mx, my, x1, y1); ctx.stroke(); ctx.restore();
  }
  drawStop(ctx, s) {
    const st = TourMap.stopState(s); if (st === 'hidden') return;
    const x = this.sx(s.lon), y = this.sy(s.lat), C = Tour.countries[s.id], sel = this.dest === s.id, r = TourMap.pinR * (sel ? 1.25 : 1);
    const cols = C ? C.colors : { a: '#8a8aa8', b: '#5a5a78', c: '#c8c8d8' };
    ctx.save();
    if (sel) { ctx.globalAlpha = 0.35 + 0.25 * Math.sin(this.t * 4); ctx.fillStyle = cols.c; ctx.beginPath(); ctx.arc(x, y, r + 8, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
    ctx.fillStyle = st === 'soon' || st === 'locked' ? '#5a5a70' : cols.a; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    if (C && C.emblem && (st === 'open' || st === 'done')) C.emblem(ctx, x, y, r * 0.7, this.t);
    else { ctx.fillStyle = st === 'done' ? '#ffd84a' : '#ffffff'; ctx.font = `${Math.round(r)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(st === 'soon' ? '…' : st === 'locked' ? '🔒' : s.world === 22 ? '22' : String(s.world), x, y + 1); }
    if (st === 'done') { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); TourKit.star(ctx, x + r * 0.8, y - r * 0.8, 5, 2.2, 5); ctx.fill(); }
    ctx.font = `${sel ? 11 : 9}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const label = s.name.toUpperCase(), tw = ctx.measureText(label).width + 10;
    const ly = s.label === 'up' ? y - r - (sel ? 19 : 16) : y + r + 3;
    ctx.fillStyle = 'rgba(10,10,30,0.7)'; rr(ctx, x - tw / 2, ly, tw, sel ? 16 : 13, 6); ctx.fill();
    ctx.fillStyle = st === 'soon' ? 'rgba(255,255,255,0.55)' : '#ffffff'; ctx.fillText(label, x, ly + 2);
    ctx.restore();
  }
  drawPlane(ctx, x, y, ang) {
    ctx.save(); ctx.translate(x, y - 16); ctx.rotate(ang);
    const flip = Math.cos(ang) < 0; if (flip) ctx.scale(1, -1);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 18, 14, 3, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.ellipse(0, 0, 15, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff4f8a'; ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, -13); ctx.lineTo(7, -13); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(3, 12); ctx.lineTo(7, 12); ctx.lineTo(5, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-16, -8); ctx.lineTo(-12, -8); ctx.lineTo(-8, 0); ctx.fill();
    ctx.fillStyle = '#38c8ff'; ctx.beginPath(); ctx.ellipse(6, -2, 4, 2.6, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = HAIR_COLORS[(Save.data && Save.data.look && Save.data.look.hair) || 0].base; ctx.beginPath(); ctx.arc(4, -6, 2.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffd84a'; ctx.fillRect(14, -1.5, 3, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; const pr = Math.sin(this.t * 40) * 6; ctx.beginPath(); ctx.moveTo(17, -pr); ctx.lineTo(17, pr); ctx.stroke();
    ctx.restore();
  }

  /* ---------- world-map extras: contrail, the Baron's jars, the airship, flight arcs, bottles, the lighthouse ---------- */
  updateWorldFx(dt) {
    const T = TourProgress.data();
    this.trail = (this.trail || []).filter(p => (p.age += dt) < 2);
    if (this.flight) this.trail.push({ lon: this.plane.lon, lat: this.plane.lat, age: 0 });
    const next = Tour.mainCountries().find(C => TourProgress.countryUnlocked(C) && !TourProgress.bossDone(C));
    const st = next ? Tour.stops[next.id] : null;
    if (st) {
      if (!this.airship) this.airship = { lon: st.lon + 7, lat: st.lat + 9, to: null };
      const a = this.airship, tgt = { lon: st.lon + 7, lat: st.lat + 9 };
      if (Math.hypot(a.lon - tgt.lon, a.lat - tgt.lat) > 0.3) { a.k = (a.k || 0) + dt / 1.5; const e = easeInOut(clamp(a.k, 0, 1)); a.from = a.from || { lon: a.lon, lat: a.lat }; a.lon = lerp(a.from.lon, tgt.lon, e); a.lat = lerp(a.from.lat, tgt.lat, e); if (a.k >= 1) { a.from = null; a.k = 0; } }
    } else this.airship = null;
    // jars shatter on the first look at the route map after the boss falls
    T.jars = T.jars || {};
    this.jarFx = this.jarFx || {};
    if (this.mode === 'route') {
      for (const C of Tour.mainCountries()) if (TourProgress.bossDone(C) && !T.jars[C.id] && !this.jarFx[C.id] && !this.flight) { this.jarFx[C.id] = { t: 0, shards: Array.from({ length: 6 }, (_, q) => ({ a: q / 6 * TAU + 0.3, v: 30 + q * 7 })) }; }
      for (const id in this.jarFx) { const f = this.jarFx[id]; f.t += dt; if (f.t > 1.2 && !T.jars[id]) { T.jars[id] = true; Save.save(); } }
    }
    this.cloudT = (this.cloudT || 0) + dt;
  }
  drawWorldFx(ctx, layer) {
    const T = TourProgress.data(), t = this.t, z = this.cam.z; T.jars = T.jars || {};
    if (layer === 'under') {
      const R = this.rReveal;
      for (const to in T.flights || {}) {
        const L = this.flightFrom(to); if (!L) continue;
        const a = Tour.stops[L], b = Tour.stops[to]; if (!a || !b) continue;
        if (R && R.r.kind === 'flight' && R.r.to === to && !R.calm) {
          // a new secret flight draws itself
          const k = clamp(R.t / 1.0, 0, 1), x0 = this.sx(a.lon), y0 = this.sy(a.lat), x1 = this.sx(b.lon), y1 = this.sy(b.lat), mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * 0.25;
          ctx.save(); ctx.strokeStyle = 'rgba(255,216,74,0.95)'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 6]); ctx.beginPath(); ctx.moveTo(x0, y0);
          for (let q = 1; q <= 24 * k; q++) { const u = q / 24, v = 1 - u; ctx.lineTo(v * v * x0 + 2 * v * u * mx + u * u * x1, v * v * y0 + 2 * v * u * my + u * u * y1); }
          ctx.stroke(); ctx.restore(); continue;
        }
        this.arc(ctx, a, b, 'rgba(255,216,74,0.95)', t * 10);
        const mx = (this.sx(a.lon) + this.sx(b.lon)) / 2, my = (this.sy(a.lat) + this.sy(b.lat)) / 2 - Math.hypot(this.sx(b.lon) - this.sx(a.lon), this.sy(b.lat) - this.sy(a.lat)) * 0.125;
        ctx.save(); ctx.translate(mx, my); ctx.scale(0.5, 0.5); this.drawPlane(ctx, 0, 16, 0); ctx.restore();
      }
      for (const n in T.bottles || {}) {
        if (!T.bottles[n]) continue; const s = Tour.stops[TOUR_BOTTLE_FROM[n]]; if (!s) continue;
        ctx.save(); ctx.strokeStyle = 'rgba(140,220,255,0.85)'; ctx.lineWidth = 2; ctx.setLineDash([3, 5]); ctx.lineDashOffset = -t * 8;
        const x0 = this.sx(s.lon), y0 = this.sy(s.lat), x1 = this.sx(TOUR_LIGHTHOUSE.lon), y1 = this.sy(TOUR_LIGHTHOUSE.lat);
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + Math.sin(+n) * 30, (y0 + y1) / 2 + 20, x1, y1); ctx.stroke(); ctx.restore();
      }
      if (this.trail && this.trail.length > 1) { ctx.save(); ctx.lineCap = 'round'; for (let q = 1; q < this.trail.length; q++) { const p0 = this.trail[q - 1], p1 = this.trail[q]; ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - p1.age / 2)})`; ctx.lineWidth = 2.5; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(this.sx(p0.lon), this.sy(p0.lat) - 16); ctx.lineTo(this.sx(p1.lon), this.sy(p1.lat) - 16); ctx.stroke(); } ctx.restore(); }
      for (const C of Tour.mainCountries()) {
        const s = Tour.stops[C.id], st = TourMap.stopState(s); if (st !== 'open' && st !== 'done') continue;
        const look = TourLandscape.look(C.id), x = this.sx(s.lon), y = this.sy(s.lat) - TourMap.pinR - 2;
        const freed = !!T.jars[C.id], fx = this.jarFx && this.jarFx[C.id], k = fx ? clamp(fx.t / 1.2, 0, 1) : freed ? 1 : 0;
        const size = 22 * (0.4 + 0.6 * easeInOut(k));
        TourLandscape.landmark(ctx, look[6], x + 16, y + 6, size, '#2f4752', look[5]);
        if (k < 1 && !fx) TourPanelFx.jar(ctx, x + 16, y + 6, 12);
        if (fx && fx.t < 1.2) { ctx.save(); ctx.strokeStyle = 'rgba(220,240,255,0.9)'; ctx.lineWidth = 1.5; for (const sh of fx.shards) { const d = sh.v * fx.t, sx = x + 16 + Math.cos(sh.a) * d, sy = y - 2 + Math.sin(sh.a) * d + 40 * fx.t * fx.t; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4, sy - 3); ctx.lineTo(sx + 2, sy + 3); ctx.closePath(); ctx.stroke(); } ctx.fillStyle = '#fff8d0'; for (let q = 0; q < 5; q++) { ctx.beginPath(); TourKit.star(ctx, x + 16 + Math.sin(q * 2.1 + t * 3) * 14, y - 4 + Math.cos(q * 1.7 + t * 3) * 10, 4, 1.5, 3); ctx.fill(); } ctx.restore(); }
        if (freed || (fx && fx.t > 0.8)) TourPanelFx.postmark(ctx, x - 22, y + 30, C.colors ? C.colors.a : '#ff4f8a');
      }
      for (const s of this.ghostPins()) TourPanelFx.ghostPin(ctx, this.sx(s.lon), this.sy(s.lat), t, s.world === 22 ? '22?' : String(s.world) + '?');
      if (this.lighthouseShown()) {
        const lr = R && R.r.kind === 'house' && !R.r.cc, sc = lr && !R.calm ? TourPanelFx.backOut(clamp(R.t / 0.45, 0, 1)) : 1;
        const x = this.sx(TOUR_LIGHTHOUSE.lon), y = this.sy(TOUR_LIGHTHOUSE.lat);
        ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); TourPanelFx.lighthouse(ctx, 0, 0, t, !!T.lighthouse); ctx.restore();
      }
    } else {
      if (this.airship) TourPanelFx.airship(ctx, this.sx(this.airship.lon), this.sy(this.airship.lat) + Math.sin(t * 1.4) * 3, t);
      const R = this.rReveal; if (R && R.r.kind === 'land') { const s = Tour.stops[R.r.id]; if (s) TourPanelFx.crack(ctx, this.sx(s.lon), this.sy(s.lat), clamp(R.t / 1.0, 0, 1)); }
      ctx.save();
      for (const [par, a, n] of [[0.3, 0.1, 5], [0.6, 0.14, 4]]) {
        ctx.fillStyle = `rgba(10,30,70,${a})`;
        for (let q = 0; q < n; q++) {
          const wx = ((q * 97 + this.cloudT * 6 * par) % 360) - 180, wy = ((q * 53) % 110) - 45;
          const x = this.mapR.x + this.mapR.w / 2 + (wx - this.cam.lon * par) * z * 0.9, y = this.mapR.y + this.mapR.h / 2 - (wy - this.cam.lat * par) * z * 0.9;
          for (const [dx, dy, rr2] of [[0, 0, 26], [22, 4, 20], [-20, 6, 18], [8, -10, 18]]) { ctx.beginPath(); ctx.ellipse(x + dx * z / 5, y + dy * z / 5, rr2 * z / 5, rr2 * z / 8, 0, 0, TAU); ctx.fill(); }
        }
      }
      ctx.restore();
    }
  }
  lighthouseShown() { const T = TourProgress.data(); return Object.keys(T.bottles || {}).filter(n => T.bottles[n]).length >= 5; }
  // the lighthouse lights its beam; a ghost pin says what its door wants
  routeTapExtras() {
    const T = TourProgress.data();
    if (this.lighthouseShown()) for (const tp of Input.taps) {
      if (Math.hypot(tp.x - this.sx(TOUR_LIGHTHOUSE.lon), tp.y - this.sy(TOUR_LIGHTHOUSE.lat)) < 26) {
        if (!T.lighthouse) { T.lighthouse = true; Save.save(); this.toast('THE BEAM IS LIT: ? FLAGS MARK HIDDEN EXITS'); Sound.play('checkpoint'); } else this.toast('THE POSTCARD LIGHTHOUSE');
        Input.taps.length = 0; return true;
      }
    }
    for (const s of this.ghostPins()) {
      const tp = Input.taps.find(q => Math.hypot(q.x - this.sx(s.lon), q.y - this.sy(s.lat)) < 26);
      if (tp) { const D = TourProgress.landDoor(s.id), need = (D && D.need) || 22; this.toast(`THIS DOOR WANTS ${need} POSTCARDS (YOU HAVE ${TourProgress.totals().gold})`); Sound.play('bump', { vol: 0.5 }); Input.taps.length = 0; return true; }
    }
    return false;
  }
  // secret lands shown as ghost pins: the door is found (tour.doors) and the land is still shut
  ghostPins() {
    const D = TourProgress.data().doors || {};
    return TOUR_ROUTE.filter(s => s.secret && D[s.id] && Tour.countries[s.id] && !TourProgress.countryUnlocked(Tour.countries[s.id]));
  }
  // the country whose level has a flight exit to `to`
  flightFrom(to) {
    for (const cc in Tour.countries) { const C = Tour.countries[cc]; for (const L of C.levels) for (const k in L.exits || {}) { const tg = L.exits[k] && L.exits[k].to; if (tg === 'flight:' + to) return cc; } }
    return null;
  }
}
const TOUR_BOTTLE_FROM = { 1: 'ec', 2: 'br', 3: 'mz', 4: 'es', 5: 'id' }, TOUR_LIGHTHOUSE = { lon: -30, lat: 5 };
// draw text wrapped to a width, centered on x (returns the height used)
function tourWrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(' '); const lines = []; let line = '';
  for (const w of words) { const t2 = line ? line + ' ' + w : w; if (ctx.measureText(t2).width > maxW && line) { lines.push(line); line = w; } else line = t2; }
  if (line) lines.push(line);
  const y0 = y - (lines.length - 1) * lineH / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, y0 + i * lineH));
  return lines.length * lineH;
}
