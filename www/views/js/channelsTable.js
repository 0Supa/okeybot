$(document).ready(function () {
    $(document).ready(function () {
        $('#table').DataTable({
            lengthMenu: [10, 25, 50, 100, 250, 500, 1000],
            pageLength: 250,
            order: [0, "asc"],
        });
    });
});