// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./CategoryManager.sol";


contract OpenBadge is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _currentTokenId;
    string private _criteria;
    string private _badgeClassURI;
    CategoryManager.Category public category;
    CategoryManager.SubCategory public subCategory;

    constructor(string memory badgeName, address initialOwner, string memory criteria, string memory badgeClassURI, CategoryManager.Category _category, CategoryManager.SubCategory _subCategory)
        ERC721(badgeName, "OPB")
        Ownable(initialOwner)
    {
        _criteria = criteria;
        _badgeClassURI = badgeClassURI;
        category = _category;
        subCategory = _subCategory;
    }

    // Equivalent to the safeMint function in the ERC-721 contract
    function deliverBadge(address to, string memory uri)
        public
        onlyOwner 
    {
        uint256 tokenId = _currentTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function getBalance(address account)
        public
        view
        returns (uint256) 
    {
        return super.balanceOf(account);
    }

    function getCriteria()
        public
        view
        returns (string memory)
    {
        return _criteria;
    }

    function getBadgeClassURI()
        public
        view
        returns (string memory)
    {
        return _badgeClassURI;
    }

    // The following functions are overrides required by Solidity.

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }
}