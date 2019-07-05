/**
 * Get dependencies
 */
const { __ } = wp.i18n;
const { Fragment, Component } = wp.element;
const { PanelBody, PanelRow, TextControl, Button, SelectControl } = wp.components;
const { registerPlugin } = wp.plugins;
const { PluginSidebar, PluginSidebarMoreMenuItem } = wp.editPost;
const { apiFetch } = wp;
const { createBlock } = wp.blocks;

import './plugin.scss';


function setApiKey(apiKey) {
  return apiFetch({
    path: "/flaticon/v1/api-key/",
    method: "POST",
    body: apiKey
  })
    .then(blockSetting => blockSetting)
    .catch(error => error);
}

class DerweiliFlaticonSidebar extends Component {

  state = {
    isRequestingToken: true,
    token : ' ',
    icons : [],
    searchTerm: '',
    isLoadingIcons: false,
    importedImages: [],
    isImporting: false,
    importingImages: [],
    apiKey: '',
    color: 0
  }

  

  componentDidMount(){

    this.loadApiKey();

    
    
  }

  async loadApiKey(){
    const apiKey = await this.getApiKey();
    console.log('apiKey',apiKey);
    this.setState({apiKey})
    this.fetchApiToken(apiKey)
  }


  getApiKey() {
    return apiFetch({
      path: "/flaticon/v1/api-key/"
    })
      .then(blockSetting => blockSetting)
      .catch(error => error);
  }

  updateApiKey = async () => {

    const apiKey = await setApiKey(this.state.apiKey);

    this.fetchApiToken(apiKey)

  };

  fetchApiToken(apiKey){
    fetch('https://api.flaticon.com/v2/app/authentication', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Accept':'application/json'
      },
      body: JSON.stringify({
        apikey: apiKey
      })
    })
      .then((response) => response.json())
      .then((responseJson) => {
        console.log('responseJson', responseJson)
        if( responseJson.hasOwnProperty('data') && responseJson.data.hasOwnProperty('token') ){
          const token = responseJson.data.token;
          this.setState({
            token,
            isRequestingToken: false
          });

        }
      })
      .catch((error) => {
        console.log('fetch error', error);
        // console.error();
      });
  }


  importImage( image_data ) {
    
    return apiFetch({
      path: "/flaticon/v1/import-image",
      method: "POST",
      body: JSON.stringify({image_data})
    })
      .then(blockSetting => {
        return blockSetting;
      })
      .catch(error => error);
  }

  async onImportImage( icon ){

    const {importingImages} = this.state;

    importingImages.push(icon.id);
    

    this.setState({
      isImporting: true,
      importingImages
    });

    const importedImageId = await this.importImage( icon.imageData );

    const {importedImages} = this.state;

    importedImages.push(icon.id);

    this.setState({
      isImporting: false,
      importedImages
    })
    this.insertImage(importedImageId);

  }


  insertImage(imgId){
    wp.data.dispatch( 'core/editor' ).insertBlock(  createBlock('core/image', {id:imgId}), 1 );
  }


  createInfo(message){
    wp.data.dispatch( 'core/notices' ).createNotice(
        'info',
        message,
        {
            isDismissible: true,
            type: 'snackbar',
        }
    )
  }



  /**
   * Search 
   */
  onSearch(){

    const { token, searchTerm, color} = this.state;

    if( searchTerm === '' ) return;
    const headers = {
      'Content-Type':'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + token
    };

    // fetch('https://api.flaticon.com/v2/items/icons?Authorization=' + token, {
    //   method: 'GET',
    //   headers,
    // })

    let url = 'https://api.flaticon.com/v2/search/icons?q=' + searchTerm;

    url += '&color=' + color;

    fetch(url, {
      method: 'GET',
      headers,
    })
      .then((response) => response.json())
      .then((data) => {
        const icons = data.data.map(icon => {
          return {
            id: icon.id,
            packName: icon.pack_name,
            svg: icon.images.svg,
            imageData: icon
          }
        })
        return icons;
      })
      .then(icons => {
        this.setState({icons})
      })
      .catch((error) => {
      });

  }

  render() {
    const { searchTerm, icons, importedImages, importingImages, apiKey, color } = this.state;

    return (
      <Fragment>
        <PluginSidebarMoreMenuItem target="derweili-flaticon-sidebar">
          {__("Flaticon", "derweili-flaticon")}
        </PluginSidebarMoreMenuItem>
        <PluginSidebar
          name="derweili-flaticon-sidebar"
          title={__("Flaticon", "derweili-flaticon")}
        >
          <PanelBody title={__("Sidebar Header", "derweili-flaticon")} >

            <PanelRow>
            <TextControl 
                label="Search"
                className="flaticon-search-field"
                value={searchTerm}
                onChange={(searchTerm) => { this.setState({searchTerm}) } }
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    this.onSearch()
                  }
                }}
                ></TextControl>
            </PanelRow>


            <PanelRow>
              <SelectControl 
                label={ __( 'Color' ) } 
                value={ color }
                onChange={ (color) => { this.setState( {color}, () => this.onSearch() ); } }
                options={[
                  {value: 0, label: "All"},
                  {value: 1, label: "Monocolor"},
                  {value: 2, label: "Multicolor"}
                ]}
                />
            </PanelRow>


            <PanelRow>
                <div className="flaticon-sidebar-icon-grid">

                  {
                    icons.length > 0 && icons.map((icon) => {
                      return (
                        <img
                          src={icon.svg}
                          alt={icon.packName}
                          width="100px"
                          height="100px"
                          onClick={(e) => { console.log('click icon', icon ); this.onImportImage( icon ) } }
                          className={` flaticon-sidebar-icon ${ importedImages.indexOf(icon.id) !== -1 && importingImages.indexOf(icon.id) !== -1 ? 'importing' : '' } `}
                          />
                      )
                    })
                  }
                </div>
              </PanelRow>
          </PanelBody>
          <PanelBody title={__("API Key", "derweili-flaticon")} initialOpen={ false }>
            <PanelRow>
              <TextControl 
                label="API Key"
                value={apiKey}
                onChange={(apiKey) => { this.setState({apiKey}) } }
                onKeyPress={event => {
                  if (event.key === 'Enter') {
                    this.updateApiKey()
                  }
                }}
                ></TextControl>
            </PanelRow>
          </PanelBody>
        </PluginSidebar>
      </Fragment>
    );
  }
}


registerPlugin("jsforwpadvgb-demo", {
  icon: "admin-plugins",
  render: DerweiliFlaticonSidebar
});
