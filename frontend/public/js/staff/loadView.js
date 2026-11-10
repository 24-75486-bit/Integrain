window.staffViewReady = fetch('/views/staff/staff.html')
  .then(response => {
    if (!response.ok) throw new Error('Unable to load the staff portal.');
    return response.text();
  })
  .then(markup => {
    const target = document.getElementById('staff-view-container');
    if (!target) throw new Error('Staff portal container was not found.');
    target.innerHTML = markup;
  })
  .catch(error => {
    const target = document.getElementById('staff-view-container');
    if (target) target.innerHTML = '<section class="panel"><p>The staff portal could not be loaded. Make sure the backend is running.</p></section>';
    return null;
  });
