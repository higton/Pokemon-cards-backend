import React, { Component } from 'react';

export default class Delete extends Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() { 
    fetch('/api/logout', {
      method: 'POST',
      body: '',
    })
}

  render() {

    return (
      <h1>Trying to delete token</h1>
    );
  }
}