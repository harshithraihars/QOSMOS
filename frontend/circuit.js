// circuit-save-handler.js (Platform-Independent Version)

// NOTE: This version is DANGEROUS for production. It skips critical auth checks 
// and relies solely on localStorage for ALL dynamic MERN/Auth/UI data.

// Utility function to simulate toast/loading (since we removed platform methods)
function logAndSimulateUI(message, isError = false) {
    const type = isError ? 'ERROR' : 'INFO';
    console.log(`[${type}] ${message}`);
    
    // Fallback UI simulation for loading/modals (basic DOM manipulation)
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (message.includes('Saving') && loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
        document.getElementById('loadingText').textContent = message;
    } else if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
    const saveModal = document.getElementById('saveCircuitModal');
    if (message.includes('Saving circuit...') || message.includes('Failed')) {
        if (saveModal) saveModal.classList.add('hidden');
    }
}

/**
 * Executes the save process using ONLY localStorage for state.
 */
async function saveCircuitHandler(isUpdate) {
    // 1. Retrieve all necessary state from localStorage (including pseudo-Auth/MERN IDs)
    const savedCircuitState = JSON.parse(localStorage.getItem('currentCircuitState') || '{}');
    const circuitData = savedCircuitState.gates || [];
    const numQubits = savedCircuitState.qubits || 3;
    
    // Retrieve MERN IDs/Props directly from localStorage
    const currentCircuitId = localStorage.getItem('qosmos_currentCircuitId');
    const circuitTitle = localStorage.getItem('qosmos_circuitTitle') || 'Untitled Circuit'; // Fallback
    const currentLanguage = localStorage.getItem('qosmos_currentLanguage') || 'qiskit';
    

    console.log(currentCircuitId,currentLanguage,circuitTitle);
    
    // 🛑 HARDCODED OR LOCAL STORAGE AUTH ID
    // We assume the user ID is stored/available locally (HIGHLY INSECURE)
    const userId = localStorage.getItem('qosmos_currentUserUid') || 'anon_user_12345'; 

    console.log("user id is here"+userId);
    
    // Check circuit content precondition (NO AUTH CHECK AVAILABLE)
    if (circuitData.length === 0) {
        logAndSimulateUI('Add gates to circuit before saving', true);
        return;
    }

    const titleInput = document.getElementById('saveTitleInput');
    // For update, use stored title; for new, use input value
    const title = titleInput ? titleInput.value.trim() : circuitTitle; 

    if (!title && !isUpdate) {
        logAndSimulateUI('Please enter a valid title.', true);
        return;
    }

    // Determine URL and method
    const method = isUpdate ? 'PUT' : 'POST';
    const finalId = isUpdate ? currentCircuitId : '';
    const url = `http://localhost:5000/api/circuits/${finalId}`;

    logAndSimulateUI('Saving circuit...', false);
    
    try {
        // Since we removed platform, we must create a placeholder for code generation
        // NOTE: This will LIKELY break since code generation relies on the platform methods.
        // We will pass a simple string placeholder instead of calling platform.generateQiskitCode()
        const placeholderCode = `// Code Generation function (platform.generateQiskitCode) was unavailable.`;

        const payload = {
            userId: userId, // From localStorage/hardcoded
            title: title, 
            qubits: numQubits,
            gates: circuitData.map(g => ({
                type: g.gate, qubit: g.qubit, column: g.col, parameters: g.params || {}
            })),
            code: { qiskit: placeholderCode }, 
            language: currentLanguage
        };

        const response = await fetch(url, { 
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseData = await response.json();            

        console.log(responseData);
        
        
        if (!response.ok) {
            throw new Error(responseData.message || `Failed to ${isUpdate ? 'update' : 'save'} circuit via API`);
        }
        
        if (!isUpdate) {
            // Store the new ID back to localStorage
            // localStorage.setItem('qosmos_currentCircuitId', responseData.circuit._id); 
            // We cannot call platform.updateUserStats(), must be handled manually or skipped.
        }

        logAndSimulateUI(`Circuit ${isUpdate ? 'updated' : 'saved'} successfully!`, false);

    } catch (error) {
        logAndSimulateUI('Failed to save circuit: ' + error.message, true);
        console.error('API Save Error:', error);
    }
}

/**
 * Handles the initial click without platform checks.
 */
function prepareToSaveCircuitHandler() {
    // Check if we have an ID to decide between update or new save
    const currentCircuitId = localStorage.getItem('qosmos_currentCircuitId');
    console.log(currentCircuitId);
    
    const isUpdate = currentCircuitId !== null;

    if(isUpdate) {
        saveCircuitHandler(true);
        return;
    }
    
    // Check gates from localStorage for new circuits
    const circuitState = JSON.parse(localStorage.getItem('currentCircuitState') || '{}');
    if (!circuitState.gates || circuitState.gates.length === 0) {
        logAndSimulateUI('Add gates to circuit before saving', true);
        return;
    }

    // Show Save Modal (we must rely on the modal HTML/CSS for visibility)
    document.getElementById('saveTitleInput').value = '';
    // Since we removed platform.showModal, we manually toggle classes
    document.getElementById('modalOverlay')?.classList.remove('hidden');
    document.getElementById('saveCircuitModal')?.classList.remove('hidden');
    document.getElementById('saveTitleInput').focus();
}



document.addEventListener('DOMContentLoaded', () => {
    // 1. Attach to the main "Save" button
    document.getElementById('saveCircuitBtn')?.addEventListener('click', () => {
        console.log("saving circuit clicked");
        prepareToSaveCircuitHandler();
    });

    // 2. Attach to the modal form submission
    document.getElementById('saveCircuitForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const isUpdate = localStorage.getItem('qosmos_currentCircuitId') !== null;
        
        saveCircuitHandler(isUpdate);
    });
});