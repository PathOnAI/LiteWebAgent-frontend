import './App.css';

function App() {

  async function startAutomation(formData: FormData) {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

      const config = {
          starting_url: tab.url,
          goal: formData.get('goal'),
          plan: formData.get('plan'),
          model: formData.get('model'),
          features: formData.get('features'),
          elements_filter: formData.get('elementsFilter'),
          branching_factor: parseInt((formData.get('branchingFactor') as string | null) || '5'),
          agent_type: 'PromptAgent',
          storage_state: 'state.json',
          log_folder: 'log',
      };

      console.log('Sending config:', config);

      const response = await fetch('http://localhost:5001/automate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          mode: 'cors',  // Added this line
          body: JSON.stringify(config)
      });

      const result = await response.json();
      console.log('Automation result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
  }

  return (
    <>
      <form action={startAutomation}>
        <div className='form-group'>
          <label htmlFor='goal'>Goal:</label>
          <input type='text' name='goal' placeholder='Enter automation goal' />
        </div>
        <div className='form-group'>
          <label htmlFor='plan'>Plan:</label>
          <input type='text' name='plan' placeholder='Enter automation plan' />
        </div>
        <div className='form-group'>
          <label htmlFor='model'>Model:</label>
          <input type='text' name='model' value="gpt-4o-mini" />
        </div>
        <div className='form-group'>
          <label htmlFor='features'>Features:</label>
          <input type='text' name='features' value='axtree' placeholder='Comma-separated features' />
        </div>
        <div className='form-group'>
          <label htmlFor='elementsFilter'>Elements Filter:</label>
          <select name='elementsFilter'>
            <option value='som'>SoM (Set-of-Mark)</option>
            <option value='visibility'>Visibility</option>
            <option value='none'>None</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor='branchingFactor'>Branching Factor:</label>
          <input type='number' name='branchingFactor' value='5' />
        </div>
        <button id="startAutomation">Start Automation</button>
      </form>
    </>
  );
}

export default App;
