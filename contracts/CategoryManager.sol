// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CategoryManager {
    enum Category { Competences, Diplomes, Formations, Experiences }
    enum SubCategory {
        MicroCompetences, CompetencesAvancees, CompetencesTechniques, SoftSkills,
        DiplomesUniversitaires, DiplomesProfessionnels, Certificats,
        FormationsEnLigne, FormationsEnPresentiel, Webinaires, Ateliers,
        ExperiencesProfessionnelles, Projets, Volontariat, Stages
    }

    struct CategoryInfo {
        Category category;
        SubCategory[] subCategories;
    }

    CategoryInfo[] public categories;
    SubCategory[] public subCategories;

    constructor() {
        SubCategory[] memory subcat1 = new SubCategory[](4);
        subcat1[0] = SubCategory.MicroCompetences;
        subcat1[1] = SubCategory.CompetencesAvancees;
        subcat1[2] = SubCategory.CompetencesTechniques;
        subcat1[3] = SubCategory.SoftSkills;
        categories.push(CategoryInfo(Category.Competences, subcat1));

        SubCategory[] memory subcat2 = new SubCategory[](3);
        subcat2[0] = SubCategory.DiplomesUniversitaires;
        subcat2[1] = SubCategory.DiplomesProfessionnels;
        subcat2[2] = SubCategory.Certificats;
        categories.push(CategoryInfo(Category.Diplomes, subcat2));

        SubCategory[] memory subcat3 = new SubCategory[](4);
        subcat3[0] = SubCategory.FormationsEnLigne;
        subcat3[1] = SubCategory.FormationsEnPresentiel;
        subcat3[2] = SubCategory.Webinaires;
        subcat3[3] = SubCategory.Ateliers;
        categories.push(CategoryInfo(Category.Formations, subcat3));

        SubCategory[] memory subcat4 = new SubCategory[](4);
        subcat4[0] = SubCategory.ExperiencesProfessionnelles;
        subcat4[1] = SubCategory.Projets;
        subcat4[2] = SubCategory.Volontariat;
        subcat4[3] = SubCategory.Stages;
        categories.push(CategoryInfo(Category.Experiences, subcat4));
    }


    function getCategories() public view returns (CategoryInfo[] memory) {
        return categories;
    }
}