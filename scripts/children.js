// Children Management Page Script

function loadChildrenPage() {
    renderChildren();
}

function toggleAddChildForm() {
    const form = document.getElementById('addChildForm');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function addChild(event) {
    event.preventDefault();

    const child = {
        name: document.getElementById('childName').value,
        age: parseInt(document.getElementById('childAge').value),
        phone: document.getElementById('childPhone').value,
        device: document.getElementById('childDevice').value
    };

    addChildToStorage(child);
    showNotification(`${child.name} added successfully!`);

    // Reset form and hide it
    document.getElementById('newChildForm').reset();
    toggleAddChildForm();

    // Reload children list
    renderChildren();
}

function renderChildren() {
    const children = getChildren();
    const childrenList = document.getElementById('childrenList');

    if (children.length === 0) {
        childrenList.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">👥</div>
                <h3>No children added yet</h3>
                <p>Click "Add New Child" to get started</p>
            </div>
        `;
        return;
    }

    childrenList.innerHTML = children.map(child => `
        <div class="child-quick-card">
            <div class="child-avatar">👤</div>
            <h3>${child.name}</h3>
            <p><strong>Age:</strong> ${child.age}</p>
            <p><strong>Phone:</strong> ${child.phone}</p>
            <p><strong>Device:</strong> ${child.device}</p>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn-small" onclick="viewChildDetails(${child.id})">View Details</button>
                <button class="btn-small btn-secondary" onclick="deleteChild(${child.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

function viewChildDetails(childId) {
    const child = getChildren().find(c => c.id === childId);
    if (!child) return;

    // For now, just show a notification with child details
    // In a full implementation, this could open a modal or navigate to a details page
    showNotification(`Viewing details for ${child.name}`);
}

function deleteChild(childId) {
    const child = getChildren().find(c => c.id === childId);
    if (!child) return;

    if (confirm(`Are you sure you want to remove ${child.name}?`)) {
        deleteChildFromStorage(childId);
        showNotification(`${child.name} removed successfully`);
        renderChildren();
    }
}

// Load children on page load
document.addEventListener('DOMContentLoaded', loadChildrenPage);
