document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');
    var modal = document.getElementById('reservationModal');
    var form = document.getElementById('reservationForm');
    var dateInput = document.getElementById('date');
    var confirmation = document.getElementById('confirmation');
    var closeModalBtn = document.getElementById('closeModal');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        selectable: true,
        firstDay: 1, // Commence le lundi
        dayHeaderFormat: { weekday: 'short' }, // Affiche LUN, MAR, etc.
        height: 'auto', // Adapter la hauteur automatiquement
        contentHeight: 'auto',
        expandRows: true, // Affiche toutes les semaines
        dateClick: function(info) {
            modal.style.display = 'flex';
            confirmation.textContent = '';
            dateInput.value = info.dateStr;
            form.style.display = 'block';
            form.reset();
            dateInput.value = info.dateStr; // Remet la date après reset
        }
    });
    calendar.render();

    // Fermer la popup
    closeModalBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        confirmation.textContent = '';
    });

    // Fermer la popup si on clique en dehors du contenu
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
            confirmation.textContent = '';
        }
    });

    const API_URL = 'https://script.google.com/macros/s/AKfycbxlaSmDbXw5HIqhwG2OZ_R1dMbm88UwVHcu_vLEsyneRgSV6HcE6vdiOIWC5ue6g3eO4w/exec'; // Remplacez par l'URL de votre Apps Script

    // Ajouter une réservation
    function saveReservation(data) {
        fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {'Content-Type': 'application/json'}
        })
        .then(r => r.json())
        .then(() => {
            confirmation.textContent = "Votre réservation a bien été enregistrée. Merci !";
            form.style.display = 'none';
            setTimeout(function() {
                modal.style.display = 'none';
                form.style.display = 'block';
                renderReservations();
            }, 2000);
        });
    }

    // Charger toutes les réservations
    function renderReservations() {
        fetch(API_URL)
        .then(r => r.json())
        .then(reservations => {
            const list = document.getElementById('reservations-list');
            list.innerHTML = '';
            if (!reservations.length) {
                list.innerHTML = "<em>Aucune réservation.</em>";
                return;
            }
            reservations.forEach((res, idx) => {
                if (res.statut === 'archivée') return;
                list.innerHTML += `
                    <div class="reservation-item">
                        <b>${res.nom}</b> (${res.email})<br>
                        <b>Date :</b> ${res.date} <br>
                        <b>Message :</b> ${res.message || '-'}<br>
                        <b>Statut :</b> <span class="statut">${res.statut}</span><br>
                        <button onclick="updateStatus(${res.id}, 'validée')">Valider</button>
                        <button onclick="updateStatus(${res.id}, 'refusée')">Refuser</button>
                        <button onclick="updateStatus(${res.id}, 'en attente')">En attente</button>
                        <button onclick="editReservation(${res.id})">Modifier</button>
                        <button onclick="archiveReservation(${res.id})">Archiver</button>
                    </div>
                    <hr>
                `;
            });
        });
    }

    // Mettre à jour le statut
    window.updateStatus = function(id, statut) {
        fetch(API_URL, {
            method: 'PUT',
            body: JSON.stringify({id, statut}),
            headers: {'Content-Type': 'application/json'}
        }).then(() => renderReservations());
    }

    // Archiver
    window.archiveReservation = function(id) {
        fetch(API_URL, {
            method: 'PUT',
            body: JSON.stringify({id, statut: 'archivée'}),
            headers: {'Content-Type': 'application/json'}
        }).then(() => renderReservations());
    }

    // Modifier une réservation
    window.editReservation = function(id) {
        fetch(API_URL)
        .then(r => r.json())
        .then(reservations => {
            const res = reservations.find(r => r.id == id);
            let newNom = prompt("Nom :", res.nom);
            let newEmail = prompt("Email :", res.email);
            let newDate = prompt("Date :", res.date);
            let newMsg = prompt("Message :", res.message);
            if (newNom && newEmail && newDate) {
                fetch(API_URL, {
                    method: 'PUT',
                    body: JSON.stringify({
                        id,
                        nom: newNom,
                        email: newEmail,
                        date: newDate,
                        message: newMsg
                    }),
                    headers: {'Content-Type': 'application/json'}
                }).then(() => renderReservations());
            }
        });
    }

    // Lors de la soumission du formulaire
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const data = {
            nom: form.nom.value,
            email: form.email.value,
            date: form.date.value,
            message: form.message.value,
            statut: 'en attente'
        };
        saveReservation(data);
    });

    // Affichage initial des réservations
    renderReservations();
});