document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);
document.getElementById('downloadFavoritesPdfBtn').addEventListener('click', () => downloadListAsPdf(checkedNumbers, 'Favorites'));
document.getElementById('downloadWorkingPdfBtn').addEventListener('click', () => {
    const workingNumbers = Array.from(numberStatuses.entries())
        .filter(([number, status]) => status === 'WORKING')
        .map(([number]) => number);
    downloadListAsPdf(new Set(workingNumbers), 'Working');
});


const checkedNumbers = new Set();
const numberStatuses = new Map();

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
         alert('PDF file parsing is not supported in this current simple version. Please upload a .txt file.');
         return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        extractAndDisplayNumbers(content);
    };

    reader.readAsText(file);
}

function extractAndDisplayNumbers(text) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    const phoneRegex = /(\+?\d{1,3}[\s-.]?)?\(?\d{3}\)?[\s-.]?\d{3}[\s-.]?\d{4}/g;
    const matches = text.match(phoneRegex);

    if (matches && matches.length > 0) {
        const uniqueNumbers = [...new Set(matches)];
       
        uniqueNumbers.forEach((number, index) => {
            if (!numberStatuses.has(number)) {
                numberStatuses.set(number, 'DEAD');
            }
            
            const numberDiv = createNumberContainer(number, index + 1); 
            resultDiv.appendChild(numberDiv);
        });
    } else {
        resultDiv.textContent = 'No phone numbers found.';
    }
}

function createNumberContainer(number, srNo) {
    const numberDiv = document.createElement('div');
    numberDiv.className = 'phone-number-container';

    const numberSpan = document.createElement('span');
    numberSpan.innerHTML = `<strong>${srNo}.</strong> ${number}`;
    
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'button-group';
   
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.className = 'copy-button';
    copyButton.onclick = () => {
        navigator.clipboard.writeText(number).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
        });
    };

    const statusButton = document.createElement('button');
    let currentStatus = numberStatuses.get(number);
    
    statusButton.textContent = currentStatus;
    statusButton.className = `status-button ${currentStatus.toLowerCase()}`;
    
    statusButton.onclick = () => {
        const newStatus = currentStatus === 'DEAD' ? 'WORKING' : 'DEAD';

        numberStatuses.set(number, newStatus);
        currentStatus = newStatus;
        statusButton.textContent = newStatus;
        statusButton.className = `status-button ${newStatus.toLowerCase()}`;
        
        updateListsDisplay();
    };

    const heartButton = document.createElement('button');
    const isChecked = checkedNumbers.has(number);
    heartButton.className = `heart-button ${isChecked ? 'checked' : 'unchecked'}`;
    heartButton.innerHTML = isChecked ? '&#x2665;' : '&#x2661;';
    
    heartButton.onclick = () => {
        if (checkedNumbers.has(number)) {
            checkedNumbers.delete(number);
            heartButton.classList.remove('checked');
            heartButton.classList.add('unchecked');
            heartButton.innerHTML = '&#x2661;';
        } else {
            checkedNumbers.add(number);
            heartButton.classList.remove('unchecked');
            heartButton.classList.add('checked');
            heartButton.innerHTML = '&#x2665;';
        }
        updateListsDisplay();
    };

    buttonGroup.appendChild(heartButton);
    buttonGroup.appendChild(statusButton);
    buttonGroup.appendChild(copyButton);
    
    numberDiv.appendChild(numberSpan);
    numberDiv.appendChild(buttonGroup);
    
    return numberDiv;
}


function updateListsDisplay() {
    updateFavoritesDisplay();
    updateWorkingDisplay();
}

function updateFavoritesDisplay() {
    const favoritesList = document.getElementById('favoritesList');
    const downloadBtn = document.getElementById('downloadFavoritesPdfBtn');
    
    favoritesList.innerHTML = '';
    
    if (checkedNumbers.size === 0) {
        favoritesList.innerHTML = '<p class="no-favorites">No numbers have been favorited yet.</p>';
        downloadBtn.style.display = 'none';
        return;
    }
    
    let srNo = 1;
    checkedNumbers.forEach(number => {
        const item = document.createElement('div');
        item.className = 'checked-number-item';
        const status = numberStatuses.get(number) || 'DEAD'; 
        
        item.innerHTML = `<span><strong>${srNo++}.</strong> ${number}</span> 
                          <span style="color: ${status === 'WORKING' ? '#008000' : '#cc0000'}; font-weight: bold;">[${status}]</span>`;
        
        favoritesList.appendChild(item);
    });

    downloadBtn.style.display = 'block';
}

function updateWorkingDisplay() {
    const workingList = document.getElementById('workingList');
    const downloadBtn = document.getElementById('downloadWorkingPdfBtn');
    
    workingList.innerHTML = '';
    
    const workingNumbers = Array.from(numberStatuses.entries())
        .filter(([number, status]) => status === 'WORKING');
    
    if (workingNumbers.length === 0) {
        workingList.innerHTML = "<p class='no-favorites'>No numbers marked 'WORKING' yet.</p>";
        downloadBtn.style.display = 'none';
        return;
    }

    let srNo = 1;
    workingNumbers.forEach(([number, status]) => {
        const item = document.createElement('div');
        item.className = 'checked-number-item';
        
        item.innerHTML = `<span><strong>${srNo++}.</strong> ${number}</span> 
                          <span style="color: #008000; font-weight: bold;">[${status}]</span>`;
        
        workingList.appendChild(item);
    });

    downloadBtn.style.display = 'block';
}


function downloadListAsPdf(numberSet, listName) {
    if (typeof window.jsPDF === 'undefined') {
        alert('PDF download library not loaded. Please ensure you are connected to the internet.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFont('Helvetica', 'Bold');
    doc.setFontSize(20);
    doc.text(`${listName} Phone Numbers List`, 10, 15);
    doc.setLineWidth(0.5);
    doc.line(10, 17, 200, 17);

    doc.setFont('Helvetica', 'Normal');
    doc.setFontSize(12);

    let y = 30;
    let srNo = 1;
    
    numberSet.forEach((number) => {
        if (y > 280) {
            doc.addPage();
            y = 15;
        }
        let line = `${srNo++}. ${number}`;
        
        if (listName === 'Favorites') {
            const status = numberStatuses.get(number) || 'DEAD';
            line += ` [Status: ${status}]`;
        }
        doc.text(line, 20, y);
        y += 7;
    });
    doc.save(`${listName.toLowerCase()}_phone_numbers.pdf`);
}
updateListsDisplay();
