// Pre-fetch on Install
var cacheName = "websusty-cache";
self.addEventListener("install", function(evt) {
	evt.waitUntil(precache());
});
function precache() {
	return caches.open(cacheName).then(function (cache) {
		// list all your assets in the array
		return cache.addAll([
			"/index.html",
			"/error.html",
			"/humans.txt",
		//	"/robots.txt",
			"/.well-known/security.txt",
			"/change.log",
			"/site.webmanifest",
			"/browserconfig.xml",
		//	"/sitemap.xml",
			"/cache/style.css",
			"/cache/script.js",
			"/cache/fonts/SourceSerifPro-Bold.woff",
			"/cache/fonts/SourceSerifPro-Bold.woff2",
			"/cache/fonts/SourceSerifPro-Italic.woff",
			"/cache/fonts/SourceSerifPro-Italic.woff2",
			"/cache/fonts/SourceSerifPro-Regular.woff",
			"/cache/fonts/SourceSerifPro-Regular.woff2",
			"/cache/fonts/SourceSerifPro-SemiBold.woff",
			"/cache/fonts/SourceSerifPro-SemiBold.woff2",
			"/apple-touch-icon.png",
			"/images/banner.png",
			"/images/droid192.png",
			"/images/droid512.png",
			"/images/icon.svg",
			"/images/ms-tile.png",
			"/favicon.ico",
			"/sw.js",
		]);
	});
}
// Return from cache, Background refresh
self.addEventListener("fetch", function(evt) {
	evt.respondWith(fromCache(evt.request));
	evt.waitUntil(update(evt.request));
});
function fromCache(request) {
	return caches.open(cacheName).then(function (cache) {
		return cache.match(request).then(function (matching) {
			return matching || Promise.reject("no-match");
		});
	});
}
function update(request) {
	return caches.open(cacheName).then(function (cache) {
		return fetch(request).then(function (response) {
			return cache.put(request, response);
		});
	});
}