if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        if ('serviceWorker' in navigator) {
            if (!navigator.serviceWorker) return;
            navigator.serviceWorker.register('sw.js').then(function (registration) {

                console.log('Registration ok!' + registration.scope);
            }).catch(function () {
                console.log('Registration ko!');
            });

            navigator.serviceWorker.ready.then(function (registration) {

                if (window.location.pathname === '/restaurant.html') {

                    var form = document.querySelector('#review-form');
                    var name = form.querySelector('#name');
                    var rating = form.querySelector('#rating');
                    var comment = form.querySelector('#comment');
                    var restaurantId = getParameterByName('id');

                    form.addEventListener('submit', (event) => {
                        event.preventDefault();

                        let pending_review = {
                            restaurant: restaurantId,
                            name: name.value,
                            rating: rating.options[rating.selectedIndex].value,
                            comments: comment.value
                        };

                        //Insert database pending review

                        idb.open('pending_review', 1, function (upgradeDb) {
                            upgradeDb.createObjectStore('pending_review', {autoIncrement: true, keyPath: 'id'});
                        }).then((database) => {
                            var trans = database.transaction('pending_review', 'readwrite');
                            return trans.objectStore('pending_review').put(pending_review);
                        }).then(() => {
                            return registration.sync.register('pending_review').then(function () {
                                console.log('Synchronization registered' + pending_review);
                            });
                        });
                    });

                }

            });
        }
    });
}