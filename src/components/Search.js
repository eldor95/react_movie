import React from "react";

export default class Search extends React.Component {
  state = {
    search: "panda",
    type: "all",
  };

  handleChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleSearch = (e) => {
    if (e.key === "Enter") {
      this.props.searchMovie(this.state.search, this.state.type);
    }
  };

  handlefilter = (e) => {
    this.setState(
      () => ({ type: e.target.dataset.type }),
      () => {
        this.props.searchMovie(this.state.search, this.state.type);
      }
    );
  };

  render() {
    return (
      <div className="container">
        <div className="input-group mb-3 block">
          <input
            type="text"
            name="search"
            className="form-control"
            placeholder="Recipient's username"
            aria-label="Recipient's username"
            aria-describedby="button-addon2"
            value={this.state.search}
            onChange={this.handleChange}
            onKeyDown={this.handleSearch}
          />
          <button
            className="btn btn-secondary px-5"
            type="button"
            id="button-addon2"
            onClick={() =>
              this.props.searchMovie(this.state.search, this.state.type)
            }
          >
            Button
          </button>
        </div>
        <div className="m-3">
          <input
            className="form-check-input me-1"
            type="radio"
            name="type"
            id="exampleRadios1"
            value="option2"
            data-type="all"
            onChange={this.handlefilter}
            checked={this.state.type === "all"}
          />
          <label className="form-check-label me-3" htmlFor="exampleRadios1">
            All
          </label>
          <input
            className="form-check-input me-1"
            type="radio"
            name="type"
            id="exampleRadios2"
            value="option2"
            data-type="movie"
            onChange={this.handlefilter}
            checked={this.state.type === "movie"}
          />
          <label className="form-check-label me-3" htmlFor="exampleRadios2">
            movie
          </label>
          <input
            className="form-check-input me-1"
            type="radio"
            name="type"
            id="exampleRadios3"
            value="option2"
            data-type="series"
            onChange={this.handlefilter}
            checked={this.state.type === "series"}
          />
          <label className="form-check-label me-3" htmlFor="exampleRadios3">
            series
          </label>
        </div>
      </div>
    );
  }
}
