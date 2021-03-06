import React from 'react';
import Autosuggest from 'react-autosuggest';
import {debounce as _debounce} from 'lodash';

import loadingGIF from '../images/loading.gif';
import defaultBookCover from '../images/DefaultBook.png'

class Search extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',          // for autosuggest
      suggestions: [],    // for autosuggest
      loading: false,
    };

    this.getSuggestionValue = this.getSuggestionValue.bind(this)
    this.renderSuggestion = this.renderSuggestion.bind(this)
    this.renderCheckoutInfo = this.renderCheckoutInfo.bind(this)
    this.debouncedLoadSuggestions = _debounce(this.loadSuggestions, 500);
  }

  focus() {
    this.autoSuggest.input.focus()
  }

  onChange = (event, { newValue }) => {
    this.setState({
      value: newValue
    });
  };

  // When suggestion is clicked, Autosuggest needs to populate the input element
  // based on the clicked suggestion. Teach Autosuggest how to calculate the
  // input value for every given suggestion.
  getSuggestionValue(suggestion) {
    return suggestion.title;
  }

  renderCheckoutInfo(locations) {
    return locations.map((location, index) => {
      return (
        <a key={index} href={location.overdrive_href}>Available at {location.library_name}<br /></a>
      )
    });
  }

  renderSuggestion(suggestion) {
    const checkout = locations => this.renderCheckoutInfo(locations);
    const selectedLibraries = this.props.selectedLibraries
    .filter(library => library.selected)
    .map(library => library.id)

    const hasDuplicates = (array) => (new Set(array)).size !== array.length;
    const allLibs = [
      ...selectedLibraries,
      ...suggestion.locations.map(location => location.library_id)
    ];

    if (hasDuplicates(allLibs)) {
      return (
        <div className="result row">
          <div className="col-2 img-col">
            <img src={suggestion.img_thumbnail || defaultBookCover}
                 alt={suggestion.title}/>
          </div>
          <div className="result-details col-5">
            <div className="title">{suggestion.title}</div>
            <div>by&nbsp;{suggestion.primary_creator_name}</div>
            <div>{suggestion.media_type}</div>
          </div>
          <div className="checkout-info col-4">
            { checkout(suggestion.locations) }
          </div>
        </div>
      );
    }
  }

  // Autosuggest will call this function every time you need to update suggestions.
  // You already implemented this logic above, so just use it.
  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({ loading: true })
    this.debouncedLoadSuggestions(value)
  };

  loadSuggestions = (value) => {
    const selectedIds = this.props.selectedLibraries
    .filter(library => library.selected)
    .map(library => library.id);

    fetch(`/search?search=${encodeURIComponent(value)}&libraries=${selectedIds.join(',')}`)
    .then(response => {
      response.json().then(data => {
        if (data.length) {
          this.setState({
            suggestions: data,
            loading: false,
          });
        } else {
          this.setState({ loading: false })
        }
      })
    });
  }

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  };

  render() {
    const { value, suggestions, loading } = this.state;

    const inputProps = {
      placeholder: 'Search for e-books and audiobooks...',
      value,
      onChange: this.onChange
    };

    return (
      <div className="search-container">
        <Autosuggest
          ref={(autoSuggest) => {
            this.autoSuggest = autoSuggest;
          }}
          suggestions={suggestions}
          onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
          onSuggestionsClearRequested={this.onSuggestionsClearRequested}
          getSuggestionValue={this.getSuggestionValue}
          renderSuggestion={this.renderSuggestion}
          inputProps={inputProps}
        />
        {loading ? <img className="media-object"
                        style={{ margin: "auto" }}
                        src={loadingGIF}
                        width="100"
                        alt="loading"/> : null}
        {value && !suggestions.length && !loading ?
          <p>Oh no! No suggestions! Try changing your search.</p> : null }
      </div>
    );
  }
}

export default Search;
